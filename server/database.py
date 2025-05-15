from datetime import date
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime
import sys

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class MockSupabaseResponse:
    def __init__(self, data, error=None):
        self.data = data
        self.error = error

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

def getCategories(user_id):
    response = supabase.table('categories').select('*').eq('clerk_id', user_id).execute()
    return response
    
def createCategory(user_id, name):
    response = supabase.table('categories').insert({
        'clerk_id': user_id,
        'name': name
    }).execute()
    return response
    
def updateCategory(user_id, category_id, name):
    response = supabase.table('categories').update({
        'name': name
    }).eq('id', category_id).eq('clerk_id', user_id).execute()
    return response
    
def deleteCategory(user_id, category_id):
    # The FOREIGN KEY constraint `ON DELETE SET NULL` on `resumes.category_id`
    # will automatically set the category_id to NULL for associated resumes
    # when a category is deleted. The previous logic to move them to an
    # 'Uncategorized' category is no longer needed and has been removed.
    
    # Delete the category
    response = supabase.table('categories').delete()\
        .eq('id', category_id)\
        .eq('clerk_id', user_id)\
        .execute()
    return response

def getResumesByCategory(user_id, category_id=None):
    query = supabase.table('resumes').select('*').eq('clerk_id', user_id)
    if category_id:
        query = query.eq('category_id', category_id)
    response = query.execute()
    return response

def getResumesCount(user_id):
    """Get count of resumes grouped by category using Python-side aggregation."""
    try:
        # Fetch all resumes for the user, including those with null category_id
        resumes_response = supabase.table('resumes') \
            .select('id, category_id') \
            .eq('clerk_id', user_id) \
            .execute()

        if hasattr(resumes_response, 'error') and resumes_response.error:
            # Propagate Supabase error if one occurs
            return MockSupabaseResponse(data=None, error=resumes_response.error)

        if not resumes_response.data:
            return MockSupabaseResponse(data=[], error=None) # No resumes at all

        # Aggregate counts in Python
        category_counts = {}
        # Keep track of uncategorized resumes
        uncategorized_count = 0
        
        for resume in resumes_response.data:
            cat_id = resume.get('category_id')
            if cat_id is not None:
                category_counts[cat_id] = category_counts.get(cat_id, 0) + 1
            else:
                uncategorized_count += 1
                
        # Add uncategorized count as a special entry with None as the key (surprisingly this works)
        if uncategorized_count > 0:
            category_counts[None] = uncategorized_count
        
        # Format the output to be similar to what the direct query might have returned
        # [{ 'category_id': id, 'count': num }, ...]
        formatted_counts = []
        for cat_id, count_val in category_counts.items():
            formatted_counts.append({'category_id': cat_id, 'count': count_val})
            
        return MockSupabaseResponse(data=formatted_counts, error=None)

    except Exception as e:
        # Catch any other unexpected errors during processing
        print(f"Error in getResumesCount (Python-side aggregation): {e}", file=sys.stderr)
        # Ensure the error structure is a dictionary with a 'message' key if creating a new error
        error_details = {'message': str(e), 'details': 'Python-side aggregation failed'}
        return MockSupabaseResponse(data=None, error=error_details)

def uploadFile(user_id, bucketName, filename, file, category_id):
    # Use the provided category_id directly
    category_id_to_use = None
    if category_id:
        # Validate the category exists for this user
        category_response = supabase.table('categories') \
            .select('id') \
            .eq('clerk_id', user_id) \
            .eq('id', category_id) \
            .execute()
        if category_response.data:
            category_id_to_use = category_response.data[0]['id']
        else:
            category_id_to_use = None
    # If no valid category_id, leave as None (uncategorized)

    # Append timestamp to filename to avoid collisions
    name, ext = os.path.splitext(filename)
    timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    unique_filename = f"{name}_{timestamp}{ext}"

    # Upload file to storage
    response = supabase.storage.from_(bucketName).upload(unique_filename, file, {'content-type': 'application/pdf'})
    fileLink = supabase.storage.from_(bucketName).get_public_url(unique_filename)

    # Insert resume record
    supabase.table('resumes').insert({
        'clerk_id': user_id,
        'category_id': category_id_to_use,
        'name': unique_filename,
        'link': fileLink,
        'date': datetime.datetime.now().date().isoformat()
    }).execute()

    return response

# New functions to move Supabase operations from app.py

def updateUserInDB(user_id, updates):
    response = supabase.table('users').update(updates).eq('clerk_id', user_id).execute()
    return response

def getResumeByIdAndUser(resume_id, user_id):
    response = supabase.table('resumes').select('*').eq('id', resume_id).eq('clerk_id', user_id).execute()
    return response

def deleteResumeFileFromStorage(bucket_name, file_name):
    # Note: Supabase storage remove can take a list of files.
    # Ensure file_name is passed as a list if that's how it's used.
    response = supabase.storage.from_(bucket_name).remove([file_name])
    return response

def deleteResumeFromDB(resume_id, user_id):
    response = supabase.table('resumes').delete().eq('id', resume_id).eq('clerk_id', user_id).execute()
    return response

def getCategoryByIdAndUser(category_id, user_id):
    response = supabase.table('categories').select('*').eq('id', category_id).eq('clerk_id', user_id).execute()
    return response

def moveResumeToCategoryInDB(resume_id, user_id, new_category_id):
    response = supabase.table('resumes').update({
        'category_id': new_category_id
    }).eq('id', resume_id).eq('clerk_id', user_id).execute()
    return response
