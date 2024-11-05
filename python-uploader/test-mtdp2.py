import requests
import hashlib
import time
import os
import random

def upload_image(file_path):
    api_url = "https://trust.dianping.com/upload.action"

    # 获取文件名和 MIME 类型
    file_name = os.path.basename(file_path)
    file_type = "image/jpeg"  # 根据文件实际类型修改，例如 'image/png'
    
    # 生成 MD5 作为新文件名
    new_file_name = hashlib.md5(str(time.time()).encode()).hexdigest() + os.path.splitext(file_name)[1]

    # 获取文件的大小
    file_size = os.path.getsize(file_path)

    # 使用 GMT 格式的最后修改时间
    last_modified_date = time.strftime('%a %b %d %Y %H:%M:%S GMT', time.gmtime(os.path.getmtime(file_path)))

    # 上传请求的参数
    post_data = {
        "id": "WU_FILE_0",
        "name": new_file_name,
        "type": file_type,
        "lastModifiedDate": last_modified_date,
        "size": file_size,
    }

    # 打开文件并准备上传
    with open(file_path, 'rb') as file:
        files = {
            "file": (new_file_name, file, file_type)
        }
        # 发起请求
        response = requests.post(api_url, data=post_data, files=files)

    # 检查响应结果
    if response.status_code == 200:
        response_data = response.json()
        if response_data.get("isSuccess") == True:
            url = response_data["url"]
            # 随机替换前缀
            prefix = random.choice(["img", "p0", "p1", "p2"])
            url = url.replace("p0.", f"{prefix}.").replace("http://", "https://")
            print("Upload successful:", url)
        else:
            print("Upload failed:", response_data.get("msg", "Unknown error"))
    else:
        print("HTTP error:", response.status_code, response.text)

# 调用上传函数，使用测试图片路径
upload_image(r"F:\Download\E9601BA8FB0DC48A8DF40509CD48069C (1).jpg")
