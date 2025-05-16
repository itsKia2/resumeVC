# from openai import OpenAI
import os
from dotenv import load_dotenv
from openai import OpenAI

import requests
import io
from pypdf import PdfReader

load_dotenv()
key: str = os.environ.get("GEMINI_API_KEY")
proj: str = os.environ.get("OPENAI_PROJECT")
org: str = os.environ.get("OPENAI_ORG")

def compareResumeJobDesc(jobDesc, resume):
    try:
        client = OpenAI(
            api_key=key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )

        response = client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=[
                {"role": "system", "content": "You are a human who sees if resumes and job descriptions match. Do not use any markdown and just use text. Return a percentage for the match along with feedback. Use specific keywords highlighted in both."},
                {
                    "role": "user",
                    "content": f"Here is the job description: {jobDesc}\n Here is the resume in text form: {resume}"
                }
            ]
        )
        reply = response.choices[0].message.content
        # print(f"[OPENAI] response - {reply}")
        return {'response': reply}, 200
    except Exception as e:
        print(f"[OpenAI Error] {e}")
        return {'error': 'Failed to contact OpenAI'}, 500

def readPdf(pdf_url: str) -> str:
    try:
        response = requests.get(pdf_url)
        response.raise_for_status()  # Handle bad URLs or network issues

        pdf_file = io.BytesIO(response.content)
        reader = PdfReader(pdf_file)

        all_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                all_text += text + "\n"

        return all_text.strip()

    except Exception as e:
        print(f"[PDF Error] {e}")
        return ""
