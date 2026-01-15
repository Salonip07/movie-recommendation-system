import google.generativeai as genai

genai.configure(api_key="YOUR_GEMINI_API_KEY")

model = genai.GenerativeModel("gemini-1.5-flash")

def ask_gemini(message):
    response = model.generate_content(
        f"You are a movie assistant. {message}"
    )
    return response.text
