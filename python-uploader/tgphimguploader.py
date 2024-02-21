#GPLv3 @BlueSkyXN
import os
import argparse
import csv
from mimetypes import guess_type
from concurrent.futures import ThreadPoolExecutor
import threading
import requests

# 线程安全的计数器和停止标志
counter_lock = threading.Lock()
counter = 0
stop_flag = False

# 写入url.log和urlmap.csv
def write_to_logs(log_file, csv_file, filename, url):
    with counter_lock:
        with open(log_file, "a") as f:
            f.write(f"{url}\n")
        with open(csv_file, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([filename, url])

def file_size_valid(filepath, max_size_bytes):
    file_size = os.path.getsize(filepath)
    return file_size <= max_size_bytes

def upload_image(filepath, log_file, csv_file, proxy=None, api_option='api-tgph-official', total_files=0, max_size_bytes=None):
    if max_size_bytes and not file_size_valid(filepath, max_size_bytes):
        print(f"Skipping {filepath} due to size limit.")
        return None
    global counter, stop_flag

    if stop_flag:
        print(f"Skipping {filepath} due to an earlier error.")
        return None

    print(f"Reading file: {filepath}")
    if api_option == 'api-tgph-cachefly':
        url = 'https://telegraph.cachefly.net/upload'
    else:
        url = 'https://telegra.ph/upload'
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
    }
    proxies = {
        'http': f'socks5://{proxy}',
        'https': f'socks5://{proxy}'
    } if proxy else None

    with open(filepath, 'rb') as f:
        mime_type = guess_type(filepath)[0]
        files = {'file': (os.path.basename(filepath), f, mime_type)}
        print(f"Uploading file: {filepath}")
        response = requests.post(url, headers=headers, files=files, proxies=proxies)
        print(f"HTTP Status Code: {response.status_code}")
        res_data = response.json()
        print(f"Response JSON: {res_data}")
        
        if res_data and 'src' in res_data[0]:
            image_url = 'https://telegra.ph' + res_data[0]['src']
            with counter_lock:
                counter += 1
                print(f"Uploaded {counter}/{total_files}: {filepath}")
            write_to_logs(log_file, csv_file, os.path.basename(filepath), image_url)
            return image_url
        elif res_data and 'error' in res_data and res_data['error'] == 'Try again later':
            stop_flag = True
            print("Received 'Try again later' error. Stopping further uploads.")
            return None
        else:
            print(f"Failed to upload: {filepath}")
            return None

def upload_images_concurrently(filepaths, log_file, csv_file, proxy, api_option, thread_count):
    total_files = len(filepaths)
    with ThreadPoolExecutor(max_workers=thread_count) as executor:
        results = list(executor.map(lambda filepath: upload_image(filepath, log_file, csv_file, proxy, api_option, total_files), filepaths))
    return results

def main(folder_path, proxy, api_option, thread_count, max_files):
    log_file = os.path.join(folder_path, "url.log")
    csv_file = os.path.join(folder_path, "urlmap.csv")

    # Initialize CSV file
    with open(csv_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['name', 'url'])

    image_files = sorted([os.path.join(folder_path, filename) 
                   for filename in os.listdir(folder_path) 
                   if filename.lower().endswith(('.jpg', '.jpeg', '.png'))])
    
    if max_files:
        image_files = image_files[:max_files]

    if not image_files:
        print("No image files found in the provided directory.")
        return

    uploaded_urls = upload_images_concurrently(image_files, log_file, csv_file, proxy, api_option, thread_count)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload images to a remote server.")
    parser.add_argument("-p", "--path", help="The folder path containing images.", required=True)
    parser.add_argument("-s", "--proxy", help="SOCKS5 proxy address.", default=None)
    parser.add_argument("-t", "--threads", help="Number of upload threads.", type=int, default=4)
    parser.add_argument("-a", "--apiOption", help="API option for TGPH", default='api-tgph-official')
    parser.add_argument("-n", "--number", help="Number of files to upload.", type=int, default=None)
    parser.add_argument("-f", "--filesize", help="Maximum file size to upload (e.g., 5M, 100K).", default=None)
    args = parser.parse_args()

    folder_path = args.path
    proxy = args.proxy
    thread_count = args.threads
    api_option = args.apiOption
    max_files = args.number

    if os.path.isdir(folder_path):
        main(folder_path, proxy, api_option, thread_count, max_files)
    else:
        print("The provided path is not a directory.")
    