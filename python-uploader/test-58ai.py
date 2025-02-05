import requests
import time
import uuid
import os
from urllib.parse import quote

class ImageUploader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
            'cache-control': 'no-cache',
            'content-type': 'text/plain;charset=UTF-8',
            'dnt': '1',
            'origin': 'https://ai.58.com',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': 'https://ai.58.com/',
            'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
        })
        
        # 使用固定的anonymous_id
        self.anonymous_id = "58Anonymous13a5126a-aab1-4124-9362-9b9a3d5687f1"
        
    def get_upload_url(self):
        """获取上传URL"""
        url = "https://im.58.com/msg/get_pic_upload_url"
        
        # 构造URL参数
        params = {
            "params": "LjAuMC4wJmFwcGlkPTEwMTQwLW1jcyU0MGppdG1vdVFyY0hzJmV4dGVuZF9mbGFnPTAmdW5yZWFkX2luZGV4PTEmc2RrX3ZlcnNpb249NjQzMiZkZXZpY2VfaWQ9NThBbm9ueW1vdXMxM2E1MTI2YS1hYWIxLTQxMjQtOTM2Mi05YjlhM2Q1Njg3ZjEmeHh6bF9zbWFydGlkPSZpZDU4PUNoQlBsMmVqUlhSbTdhTlFNTWRrQWclM0QlM0Q1dXNlcl9pZD01OEFub255bW91czEzYTUxMjZhLWFhYjEtNDEyNC05MzYyLTliOWEzZDU2ODdmMSZzb3VyY2U9MTQmaW1fdG9rZW49NThBbm9ueW1vdXMxM2E1MTI2YS1hYWIxLTQxMjQtOTM2Mi05YjlhM2Q1Njg3ZjEmY2xpZW50X3ZlcnNpb249MS4wJmNsaWVudF90eXBlPXBjd2ViJm9zX3R5cGU9Q2hyb21lJm9zX3ZlcnNpb249MTMy",
            "version": "j1.0"
        }
        
        # 构造POST数据
        data = 'cl9zb3VyY2UiOjE0LCJ0b19pZCI6IjEwMDAyIiwidG9fc291cmNlIjoxMDAsImZpbGVfc3VmZml4cyI6WyJwbmciXX01eyJzZW5kZXJfaWQiOiI1OEFub255bW91czEzYTUxMjZhLWFhYjEtNDEyNC05MzYyLTliOWEzZDU2ODdmMSIsInNlbmRl'
        
        # 使用POST请求
        response = self.session.post(url, params=params, data=data)
        print("Debug - Response:", response.text)  # 调试输出
        
        if response.status_code == 200:
            data = response.json()
            if data.get("error_code") == 0:
                return data["data"]["upload_info"][0]
        return None

    def upload_image(self, image_path):
        """上传图片"""
        # 1. 获取上传URL
        upload_info = self.get_upload_url()
        if not upload_info:
            return {"success": False, "message": "Failed to get upload URL"}
            
        # 2. 上传文件
        try:
            with open(image_path, 'rb') as f:
                headers = {
                    'Content-Type': 'image/jpeg',
                    'Origin': 'https://ai.58.com',
                    'Referer': 'https://ai.58.com/'
                }
                response = self.session.put(upload_info['url'], data=f, headers=headers)
                print("Debug - Upload Response:", response.text)  # 调试上传响应
                
                if response.status_code == 200:
                    # 获取不带签名参数的URL
                    final_url = upload_info['url'].split('?')[0]
                    return {
                        "success": True,
                        "url": final_url,
                        "message": "Upload successful"
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Upload failed with status code: {response.status_code}"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "message": f"Error during upload: {str(e)}"
            }

if __name__ == "__main__":
    uploader = ImageUploader()
    result = uploader.upload_image(r"F:\Download\IMG_9865.JPG")
    print(result)