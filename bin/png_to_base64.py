import base64
import sys
import pyperclip

def png_to_base64(filepath: str):
    with open(filepath, "rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode("utf-8")
        pyperclip.copy(encoded)
        print("✅ Base64 string copied to clipboard.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python {sys.argv[0]} <path_to_png>")
    else:
        png_to_base64(sys.argv[1])
