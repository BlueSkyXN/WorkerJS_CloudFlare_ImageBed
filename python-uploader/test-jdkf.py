import requests

# 上传的目标URL
url = "https://kefu-jtalk.jd.com/jtalk/hfive/resource/image/upload"

# 请求头设置
headers = {
    "accept": "application/json",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "none",
    "x-requested-with": "XMLHttpRequest"
}

# 本地文件路径和上传时的文件名
file_path = r"F:\Download\20240416-164224.jpg"
upload_filename = "test.jpg"

# 打开文件并准备上传
with open(file_path, 'rb') as file:
    files = {
        "files": (upload_filename, file, "image/jpeg")
    }
    
    try:
        # 发送POST请求
        response = requests.post(url, headers=headers, files=files)
        
        # 检查响应状态码
        if response.status_code == 200:
            # 解析并打印JSON响应
            response_data = response.json()
            print("上传成功！响应内容如下：")
            print(response_data)
            
            # 提取URL
            upload_url = response_data.get('data', [{}])[0].get('url', None)
            if upload_url:
                print("提取的上传URL为：")
                print(upload_url)
            else:
                print("未找到有效的上传URL。")
        else:
            print(f"上传失败，状态码：{response.status_code}")
            print("响应内容：")
            print(response.text)
    except requests.exceptions.RequestException as e:
        print("上传过程中发生错误：", e)
