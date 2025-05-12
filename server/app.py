from flask import Flask, request, send_from_directory
import os
import warnings
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import AuthenticateRequestOptions
from flask_cors import CORS

from database import createUser, deleteUser, getUsers, initSupabase

UPLOAD_FOLDER = '/tmp/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Suppress specific warning from Clerk SDK
warnings.filterwarnings(
    'ignore', 
    message='authenticate_request method is applicable in the context of Backend APIs only.'
)

# load_dotenv()

# url: str = os.environ.get("SUPABASE_URL")
# key: str = os.environ.get("SUPABASE_KEY")
# supabase: Client = create_client(url, key)

app = Flask(__name__, static_folder="../client/dist", static_url_path="")

CORS(app)

# Serve the frontend
@app.route("/")
def serve_react_index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def serve_static_files(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

@app.route("/api/hello")
def hello():
    return {"message": "Hello from Flask!!!"}

def authenticate_with_clerk(request):
    sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
    request_state = sdk.authenticate_request(
        request,
        AuthenticateRequestOptions(
            authorized_parties=['http://127.0.0.1:5000', 'http://localhost:5173']
        )
    )
    return request_state

def update_onboarding_status(user_id, status):
    sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
    sdk.users.update_metadata(
        user_id=user_id,
        public_metadata={
            'onboardingComplete': status
        }
    )

# error 401 user not signed in
# error 400 user id not found
# error 404 user not found in db
# error 405 user details not provided
# error 500 error fetching user from db
# response 200 successful
@app.route('/api/user', methods=['POST', 'PUT', 'DELETE', 'GET'])
def user_endpoint():
    request_state = authenticate_with_clerk(request)

    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400

    data = request.get_json()
    if request.method == 'GET':
        # Get user
        try:
            response = getUsers(user_id)

            if response.get('error'):
                raise Exception(response['error']['message'])

            if not response.data:
                return {'error': 'User not found'}, 404

            return {'user': response.data[0]}, 200
        except Exception as e:
            print(f"Error fetching user: {e}", file=sys.stderr)
            return {'error': str(e)}, 500

    elif request.method == 'POST':
        # Create user
        data = request.get_json()
        email = data.get('email')
        name = data.get('name')

        if not email or not name:
            return {'error': 'Missing required fields'}, 405

        try:
            # First, check if user already exists
            existing_user = getUsers(user_id)
            
            if not existing_user.data:
                # Only create if user doesn't exist
                createUser(user_id, email, name)
                print(f"Created new user: {user_id}", file=sys.stderr)
            else:
                print(f"User already exists: {user_id}", file=sys.stderr)
            
            # Always set onboarding complete (idempotent operation)
            sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
            sdk.users.update_metadata(
                user_id=user_id,
                public_metadata={
                    'onboardingComplete': True
                }
            )
            print(f"Onboarding complete for user: {user_id}", file=sys.stderr)
            
            return {'message': 'User created/verified and onboarding completed'}, 200
        except Exception as e:
            print(f"Error during user creation: {e}", file=sys.stderr)
            return {'error': str(e)}, 500

    elif request.method == 'PUT':
        # Update user
        updates = {}
        if 'email' in data:
            updates['email'] = data['email']
        if 'name' in data:
            updates['name'] = data['name']

        if 'onboardingComplete' in data:
            try:
                update_onboarding_status(user_id, data['onboardingComplete'])
            except Exception as e:
                print(f"Error updating onboarding status: {e}", file=sys.stderr)
                return {'error': str(e)}, 500

        if not updates and 'onboardingComplete' not in data:
            return {'error': 'No fields to update'}, 400

        try:
            if updates:
                response = supabase.table('users').update(updates).eq('clerk_id', user_id).execute()

                if response.get('error'):
                    raise Exception(response['error']['message'])

            return {'message': 'User updated successfully'}, 200
        except Exception as e:
            print(f"Error updating user: {e}", file=sys.stderr)
            return {'error': str(e)}, 500

    elif request.method == 'DELETE':
        # Delete user
        # If the user deletes their account through Clerk, this endpoint doesn't make sense since it uses the Clerk user object, but it's useful for testing the onboarding endpoint.
        try:
            response = deleteUser(user_id)

            if response.get('error'):
                raise Exception(response['error']['message'])

            update_onboarding_status(user_id, False)

            return {'message': 'User deleted successfully and onboardingComplete set to false'}, 200
        except Exception as e:
            print(f"Error deleting user: {e}", file=sys.stderr)
            return {'error': str(e)}, 500
    
    return {'error': 'Invalid request method'}, 405

# error 401 user not signed in
# error 400 user id not found
# error 404 user not found in db
# error 405 user details not provided
# error 500 error during onboarding
# response 200 successful
@app.route('/api/onboarding', methods=['POST'])
def onboarding():
    request_state = authenticate_with_clerk(request)

    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400

    data = request.get_json()
    email = data.get('email')
    name = data.get('name')

    if not email or not name:
        return {'error': 'Missing required fields'}, 405

    try:
        # Check if the user already exists in the database
        # existing_user = supabase.table('users').select('*').eq('clerk_id', user_id).execute()
        existing_user = getUsers(user_id)

        if not existing_user.data:
            # Insert user into the database only if they don't exist
            createUser(user_id, email, name)

        # Update Clerk metadata unconditionally
        sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
        sdk.users.update_metadata(
            user_id=user_id,
            public_metadata={
                'onboardingComplete': True
            }
        )

        return {'message': 'Onboarding complete'}, 200
    except Exception as e:
        print(f"Error during onboarding: {e}", file=sys.stderr)
        return {'error': str(e)}, 500

# error 401 user not signed in
# error 400 user id not found
# response 200 successful
@app.route('/api/userId', methods=['GET'])
def get_user_id():
    request_state = authenticate_with_clerk(request)

    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400

    return {'userId': user_id}, 200

# error 401 user not signed in
# error 400 user id not found
# error 402 incorrect file type uploaded
# response 200 successful
@app.route('/api/resume-upload', methods=['POST'])
def get_resume():
    request_state = authenticate_with_clerk(request)
    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400

    if 'pdf' not in request.files:
        return {'error': 'Incorrect file type provided'}, 402
    file = request.files['pdf']
    # filename = secure_filename(file.filename)
    filename = file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    initSupabase()

    # print(f"Received resume file: {file.filename} from user: {user_id}", file=sys.stderr)
    return {'message': f'Upload successful - {filepath}'}, 200
