import requests
import os
import random

# 上传图片的本地路径
image_path = r"F:\Download\20241011-111233.jpg"

# AliExpress 上传接口的 URL
upload_url = "https://filebroker.aliexpress.com/x/upload?jiketuchuang=1"

# 允许的主机名
cdn_hosts = ["ae01", "ae02", "ae03", "ae04", "ae05"]

def load_cookie(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    else:
        print(f"错误: Cookie 文件不存在。文件路径: {file_path}")
        return None

def upload_image(image_path):
    if not os.path.exists(image_path):
        print("错误: 图片文件不存在。")
        return

    # 加载 Cookie
    cookie_path = r"G:\Github\WorkerJS_CloudFlare_ImageBed\python-uploader\ck-ali.txt"
    cookie = load_cookie(cookie_path)
    if not cookie:
        return

    # 请求头设置
    headers = {
        "Origin": "https://filebroker.aliexpress.com",
        "Cookie": cookie
    }

    # 文件参数
    files = {
        'file': (os.path.basename(image_path), open(image_path, 'rb'))
    }

    # 其他参数
    data = {
        "bizCode": "ae_profile_avatar_upload"
    }

    try:
        # 发送 POST 请求上传图片
        response = requests.post(upload_url, headers=headers, files=files, data=data)
        response.raise_for_status()  # 检查请求是否成功
        result = response.json()

        # 处理返回结果
        if result.get("code") == 0:
            # 上传成功，随机选择一个 CDN 主机名
            url = result.get("url")
            if url:
                selected_host = random.choice(cdn_hosts)
                final_url = url.replace("ae02", selected_host)
                print(f"上传成功，图片 URL: {final_url}")
            else:
                print("上传失败：未返回图片 URL。")
        else:
            print("上传失败，请检查是否已登录阿里巴巴账号？")
            login_confirm = input("是否前往登录页面？(y/n): ")
            if login_confirm.lower() == 'y':
                print("请前往登录页面：https://best.aliexpress.com/")
    except requests.exceptions.RequestException as e:
        # 网络请求异常处理
        print(f"请求失败: {e}")
    except ValueError:
        # JSON 解码失败
        print("上传失败：无法解析服务器返回的响应。")

# 执行图片上传
upload_image(image_path)