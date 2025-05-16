from flask import Flask, request, send_from_directory
import os
import warnings
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import AuthenticateRequestOptions
from flask_cors import CORS
from io import BufferedReader

# Import supabase instance along with other db functions
from database import (
    MockSupabaseResponse, supabase, createUser, deleteUser, getUsers, uploadFile,
    getCategories, getResumesByCategory, getResumesCount, 
    createCategory, updateCategory, deleteCategory, getResumesForUser,
    updateUserInDB, getResumeByIdAndUser, deleteResumeFileFromStorage,
    deleteResumeFromDB, getCategoryByIdAndUser, moveResumeToCategoryInDB
)

from jobmatch import compareResumeJobDesc, readPdf

UPLOAD_FOLDER = '/tmp/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Suppress specific warning from Clerk SDK
warnings.filterwarnings(
    'ignore', 
    message='authenticate_request method is applicable in the context of Backend APIs only.'
)

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

            if hasattr(response, 'error') and response.error:
                raise Exception(response.error['message'])

            if not (hasattr(response, 'data') and response.data):
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
            
            if not (hasattr(existing_user, 'data') and existing_user.data):
                # Only create if user doesn't exist
                createUser(user_id, email, name)
                print(f"Created new user: {user_id}", file=sys.stderr)
            else:
                print(f"User already exists: {user_id}", file=sys.stderr)
            
            # Always set onboarding complete (idempotent operation)
            update_onboarding_status(user_id, True)
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
                response = updateUserInDB(user_id, updates)

                if hasattr(response, 'error') and response.error:
                    error_message = "Failed to update user."
                    if hasattr(response.error, 'message') and response.error.message:
                        error_message = response.error.message
                    elif isinstance(response.error, dict) and 'message' in response.error:
                        error_message = response.error['message']
                    raise Exception(error_message)

            return {'message': 'User updated successfully'}, 200
        except Exception as e:
            print(f"Error updating user: {e}", file=sys.stderr)
            return {'error': str(e)}, 500

    elif request.method == 'DELETE':
        # Delete user
        # If the user deletes their account through Clerk, this endpoint doesn't make sense since it uses the Clerk user object, but it's useful for testing the onboarding endpoint.
        try:
            response = deleteUser(user_id)

            if hasattr(response, 'error') and response.error:
                raise Exception(response.error['message'])

            update_onboarding_status(user_id, False)

            return {'message': 'User deleted successfully and onboardingComplete set to false'}, 200
        except Exception as e:
            print(f"Error deleting user: {e}", file=sys.stderr)
            return {'error': str(e)}, 500
    
    return {'error': 'Invalid request method'}, 405

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

    # GETTING PDF
    if 'pdf' not in request.files:
        return {'error': 'Incorrect file type provided'}, 402
    file = request.files['pdf']
    # filename = secure_filename(file.filename)
    filename = file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # GETTING CATEGORIES
    category_id = request.form.get('categoryId')

    streamFile = BufferedReader(file.stream)
    uploadFile(user_id, "resume", filename, streamFile, category_id)

    # print(f"Received resume file: {file.filename} from user: {user_id}", file=sys.stderr)
    return {'message': f'Upload successful - {filename}'}, 200

# Get all categories for a user
@app.route('/api/categories', methods=['GET', 'POST'])
def categories_handler():
    request_state = authenticate_with_clerk(request)
    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400
        
    # GET: Fetch all categories
    if request.method == 'GET':
        try:
            # Get categories
            categories_response = getCategories(user_id)
            # Get resume counts per category
            counts_response = getResumesCount(user_id)
            
            # Ensure categories_response.data is a list, default to empty list if not
            categories = []
            if hasattr(categories_response, 'data') and isinstance(categories_response.data, list):
                categories = categories_response.data
            elif hasattr(categories_response, 'error') and categories_response.error:
                print(f"Error fetching categories data: {categories_response.error}", file=sys.stderr)
            
            count_by_category = {}
            
            # Ensure counts_response.data is a list before iterating, default to empty if not
            uncategorized_count = 0
            if hasattr(counts_response, 'data') and isinstance(counts_response.data, list):
                for item in counts_response.data:
                    # Ensure item is a dict and has the required keys
                    if isinstance(item, dict) and 'category_id' in item and 'count' in item:
                        if item['category_id'] is None:
                            uncategorized_count = item['count']
                        else:
                            count_by_category[str(item['category_id'])] = item['count']
            elif hasattr(counts_response, 'error') and counts_response.error:
                # If there was an error fetching counts, log it and continue with empty counts
                print(f"Error fetching resume counts: {counts_response.error}", file=sys.stderr)
            
            # Add resume count to each category
            for category in categories: # categories is now guaranteed to be a list
                if isinstance(category, dict) and 'id' in category:
                    category['resumeCount'] = count_by_category.get(str(category['id']), 0)
                
            # Count all resumes for this user (for "All Resumes" category)
            # Include both categorized and uncategorized resumes
            all_resumes_count = sum(count_by_category.values()) + uncategorized_count
            
            # Add "All" category
            categories.insert(0, {
                'id': 'all',
                'name': 'All',
                'resumeCount': all_resumes_count
            })
            
            return {'categories': categories}, 200
        except Exception as e:
            print(f"Error fetching categories: {e}", file=sys.stderr)
            return {'error': str(e)}, 500
            
    # POST: Create a new category
    elif request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        
        if not name or not name.strip():
            return {'error': 'Category name is required'}, 400
            
        try:
            response = createCategory(user_id, name.strip())
            
            if hasattr(response, 'error') and response.error:
                error_message = "Failed to create category."
                if hasattr(response.error, 'message') and response.error.message:
                    error_message = response.error.message
                elif isinstance(response.error, dict) and 'message' in response.error:
                    error_message = response.error['message']
                raise Exception(error_message)
            
            if hasattr(response, 'data') and response.data and len(response.data) > 0:
                return {'message': 'Category created successfully', 'category': response.data[0]}, 201
            else:
                raise Exception("Category creation did not return the expected data.")

        except Exception as e:
            print(f"Error creating category: {e}", file=sys.stderr)
            return {'error': str(e)}, 500

# Handle specific category operations (update/delete/get)
@app.route('/api/categories/<category_id>', methods=['GET', 'PUT', 'DELETE'])
def category_handler(category_id):
    request_state = authenticate_with_clerk(request)
    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400
        
    # Don't allow modifying the "all" special category
    if category_id == 'all':
        return {'error': 'Cannot modify the "All Resumes" category'}, 400
        
    # GET: Fetch a specific category by its ID
    if request.method == 'GET':
        if category_id == 'all': # Should not happen due to check above, but good practice
            return {'error': 'Cannot fetch "all" as a specific category via this endpoint'}, 400
        try:
            response = getCategoryByIdAndUser(category_id, user_id)

            if hasattr(response, 'error') and response.error:
                error_message = "Failed to fetch category."
                if hasattr(response.error, 'message') and response.error.message:
                    error_message = response.error.message
                elif isinstance(response.error, dict) and 'message' in response.error:
                    error_message = response.error['message']
                raise Exception(error_message)
            
            if not (hasattr(response, 'data') and response.data and len(response.data) > 0):
                return {'error': 'Category not found or not authorized'}, 404
            
            return {'category': response.data[0]}, 200
        except Exception as e:
            print(f"Error fetching category {category_id}: {e}", file=sys.stderr)
            return {'error': str(e)}, 500

    # PUT: Update a category
    elif request.method == 'PUT':
        data = request.get_json()
        name = data.get('name')
        
        if not name or not name.strip():
            return {'error': 'Category name is required'}, 400
            
        try:
            response = updateCategory(user_id, category_id, name.strip())
            
            if hasattr(response, 'error') and response.error:
                error_message = "Failed to update category."
                if hasattr(response.error, 'message') and response.error.message:
                    error_message = response.error.message
                elif isinstance(response.error, dict) and 'message' in response.error:
                    error_message = response.error['message']
                raise Exception(error_message)
                
            if not (hasattr(response, 'data') and response.data and len(response.data) > 0):
                return {'error': 'Category not found or not authorized'}, 404
                
            return {'message': 'Category updated successfully', 'category': response.data[0]}, 200
        except Exception as e:
            print(f"Error updating category: {e}", file=sys.stderr)
            return {'error': str(e)}, 500
            
    # DELETE: Delete a category
    elif request.method == 'DELETE':
        try:
            response = deleteCategory(user_id, category_id)
            
            if hasattr(response, 'error') and response.error:
                error_message = "Failed to delete category."
                if hasattr(response.error, 'message') and response.error.message:
                    error_message = response.error.message
                elif isinstance(response.error, dict) and 'message' in response.error:
                    error_message = response.error['message']
                raise Exception(error_message)
                
            if not (hasattr(response, 'data') and response.data and len(response.data) > 0):
                return {'error': 'Category not found or not authorized to delete'}, 404
                
            return {'message': 'Category deleted successfully'}, 200
        except Exception as e:
            print(f"Error deleting category: {e}", file=sys.stderr)
            return {'error': str(e)}, 500

# Get resumes for a category
@app.route('/api/categories/<category_id>/resumes', methods=['GET'])
def get_category_resumes(category_id):
    request_state = authenticate_with_clerk(request)
    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400
        
    try:
        if category_id == 'all':
            # Get all resumes for the user
            response = getResumesByCategory(user_id)
        else:
            # Get resumes for specific category
            response = getResumesByCategory(user_id, category_id)
            
        resumes = response.data
        return {'resumes': resumes}, 200
    except Exception as e:
        print(f"Error fetching resumes: {e}", file=sys.stderr)
        return {'error': str(e)}, 500

# Delete a resume
@app.route('/api/resumes/<resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    request_state = authenticate_with_clerk(request)
    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400
    
    try:
        # First check if resume belongs to user
        response = getResumeByIdAndUser(resume_id, user_id)
        
        if not (hasattr(response, 'data') and response.data and len(response.data) > 0):
            return {'error': 'Resume not found or not authorized'}, 404
        
        # Get file name to delete from storage
        file_name = response.data[0]['name']
        
        # Delete file from storage
        try:
            deleteResumeFileFromStorage('resume', file_name)
        except Exception as storage_error:
            print(f"Warning: Could not delete file from storage: {storage_error}", file=sys.stderr)
        
        # Delete resume record from database
        delete_response = deleteResumeFromDB(resume_id, user_id)
        
        if hasattr(delete_response, 'error') and delete_response.error:
            error_message = "Failed to delete resume from database."
            if hasattr(delete_response.error, 'message') and delete_response.error.message:
                error_message = delete_response.error.message
            elif isinstance(delete_response.error, dict) and 'message' in delete_response.error:
                error_message = delete_response.error['message']
            raise Exception(error_message)
        
        return {'message': 'Resume deleted successfully'}, 200
    except Exception as e:
        print(f"Error deleting resume: {e}", file=sys.stderr)
        return {'error': str(e)}, 500
        
# Move a resume to a different category
@app.route('/api/resumes/<resume_id>/move', methods=['PUT'])
def move_resume(resume_id):
    request_state = authenticate_with_clerk(request)
    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400
    
    data = request.get_json()
    new_category_id = data.get('categoryId')
    if not new_category_id:
        return {'error': 'Category ID not provided'}, 400
    
    try:
        # First check if resume belongs to user
        response = getResumeByIdAndUser(resume_id, user_id)
        
        if not (hasattr(response, 'data') and response.data and len(response.data) > 0):
            return {'error': 'Resume not found or not authorized'}, 404
        
        # Check if category exists and belongs to user
        category_response = getCategoryByIdAndUser(new_category_id, user_id)
        
        if not (hasattr(category_response, 'data') and category_response.data and len(category_response.data) > 0):
            return {'error': 'Category not found or not authorized'}, 404
        
        # Update resume record
        update_response = moveResumeToCategoryInDB(resume_id, user_id, new_category_id)
        
        if hasattr(update_response, 'error') and update_response.error:
            error_message = "Failed to move resume."
            if hasattr(update_response.error, 'message') and update_response.error.message:
                error_message = update_response.error.message
            elif isinstance(update_response.error, dict) and 'message' in update_response.error:
                error_message = update_response.error['message']
            raise Exception(error_message)
        
        return {'message': 'Resume moved successfully'}, 200
    except Exception as e:
        print(f"Error moving resume: {e}", file=sys.stderr)
        return {'error': str(e)}, 500

@app.route('/api/get-user-resume-names', methods=['GET'])
def getUserResumeNames():
    request_state = authenticate_with_clerk(request)
    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400

    allResumes = getResumesForUser(user_id)
    if isinstance(allResumes, MockSupabaseResponse):
        return {'error': 'Resumes not returned properly'}, 412

    # Extract resume names (you might need to adjust this depending on your data structure)
    resumes = []
    for r in allResumes:
        resumes.append({
            'name': r.get('name'),
            'link': r.get('link'),
        })

    return {'resumes': resumes}, 200

@app.route('/api/job-description', methods=['POST'])
def getResumeMatch():
    request_state = authenticate_with_clerk(request)
    if not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401

    user_id = request_state.payload.get('sub')
    if not user_id:
        return {'error': 'User ID not found'}, 400

    data = request.get_json()
    resumeLink = data.get('resumeLink')

    job_description = data['jobDescription']
    # print(f"[JOB DESCRIPTION] from user {user_id}:\n{job_description}")

    # WE ARE NOT READING ALL RESUMES ANYMORE, WE JUST WANT THE SPECIFIC ONE
    # allResumes = getResumesForUser(user_id)
    # if isinstance(allResumes, MockSupabaseResponse):
    #     return {'error': 'Resumes not being returned properly'}, 412
    # allPdfTexts = []
    # for resume in allResumes:
    #     allPdfTexts.append(readPdf(resume.get('link')))

    result, status = compareResumeJobDesc(job_description, readPdf(resumeLink))
    reply = result['response']
    # print(reply.response)

    return {'analysis': reply}, 200
