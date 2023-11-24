import requests
import sys

def upload_file(file_path):
    url = "https://community.codewave.163.com/gateway/lowcode/api/v1/app/upload"
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Referer': 'https://www.gov.cn'
    }
    files = {'file': open(file_path, 'rb')}
    response = requests.post(url, headers=headers, files=files)
    if response.status_code == 200:
        data = response.json()
        upload_url = data['result']

        # Calculate the equivalent URL
        original_base = "https://lcap-static-saas.nos-eastchina1.126.net/"
        new_base = "https://community.codewave.163.com/upload/"
        equivalent_url = upload_url.replace(original_base, new_base)

        return upload_url, equivalent_url
    else:
        error_message = f"File upload failed with status code: {response.status_code}\nResponse body: {response.text}"
        raise Exception(error_message)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python upload_script.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]
    try:
        upload_url, equivalent_url = upload_file(file_path)
        print("File uploaded successfully.")
        print("Upload URL:", upload_url)
        print("Equivalent URL:", equivalent_url)
    except Exception as e:
        print("Error:", str(e))
