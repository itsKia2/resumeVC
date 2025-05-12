import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def initSupabase():
    print(url)

# response = supabase.storage.from_('bucket_name').upload('file_path', file)

def getUsers(user_id):
    response = supabase.table('users').select('*').eq('clerk_id', user_id).execute()
    return response

def createUser(user_id, email, name):
    supabase.table('users').insert({
        'clerk_id': user_id,
        'email': email,
        'name': name
    }).execute()
    return 1

def deleteUser(user_id):
    response = supabase.table('users').delete().eq('clerk_id', user_id).execute()
    return response
