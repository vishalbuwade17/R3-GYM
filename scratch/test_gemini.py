import google.generativeai as genai
import os

api_key = "AIzaSyAXlw_cy2oK_PFh18IIj_W86-arvv1kyMc"
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Say hello")
    print("SUCCESS:", response.text)
except Exception as e:
    print("FAILED:", str(e))
