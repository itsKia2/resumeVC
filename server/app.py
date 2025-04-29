from flask import Flask, request, send_from_directory
import os
import warnings
from dotenv import load_dotenv
from supabase import create_client, Client
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import AuthenticateRequestOptions
from flask_cors import CORS
import sys

# Suppress specific warning from Clerk SDK
warnings.filterwarnings(
    'ignore', 
    message='authenticate_request method is applicable in the context of Backend APIs only.'
)

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = Flask(__name__)

CORS(app)

# Serve the frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join("../client/dist", path)):
        return send_from_directory("../client/dist", path)
    else:
        return send_from_directory("../client/dist", "index.html")

@app.route('/api/userId')
def userId():
    sdk = Clerk(bearer_auth=os.getenv('CLERK_SECRET_KEY'))
    #print("Request headers:", request.headers, file=sys.stderr)
    #print("Request args:", request.args, file=sys.stderr)
    #print("Request data:", request.data, file=sys.stderr)

    request_state = sdk.authenticate_request(
        request,
        AuthenticateRequestOptions(
            authorized_parties=['http://127.0.0.1:5000']
        )
    )

    if request_state.is_signed_in and request_state.payload and 'sub' in request_state.payload:
        return {'userId': request_state.payload['sub']}, 200
    elif not request_state.is_signed_in:
        return {'error': 'User not signed in'}, 401
    else:
        return {'error': 'User ID not found in request state'}, 500