import sys
import os
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from datetime import datetime

# Filebase的S3兼容的API端点和凭据
endpoint_url = 'https://s3.filebase.com'
access_key = ''
secret_key = ''

# 获取命令行参数
if len(sys.argv) != 2:
    print("Usage: python upload_to_filebase.py <local_file_path>")
    sys.exit(1)

local_file_path = sys.argv[1]
# Filebase的S3兼容存储桶名称
bucket_name = ''

# 使用 os.path.basename() 只提取文件名
file_name, file_extension = os.path.splitext(os.path.basename(local_file_path))

# 生成当前时间戳，格式为：年-月-日_时-分-秒
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

# 使用文件名 + 时间戳 作为 S3 文件名
s3_file_key = f"{file_name}_{timestamp}{file_extension}"

# 创建S3客户端，增加超时设置
try:
    print("Creating S3 client...")
    s3 = boto3.client(
        's3',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        endpoint_url=endpoint_url,
        config=Config(signature_version='s3v4', connect_timeout=10, read_timeout=10)
    )
    print("S3 client created successfully.")
except Exception as e:
    print(f"Error creating S3 client: {e}")
    sys.exit(1)

# 上传文件
def upload_file_to_s3():
    try:
        print(f"Starting to upload '{local_file_path}' to bucket '{bucket_name}'...")
        s3.upload_file(local_file_path, bucket_name, s3_file_key)
        print(f"File '{local_file_path}' successfully uploaded to '{bucket_name}/{s3_file_key}'")
    except Exception as e:
        print(f"Error uploading file: {e}")
        sys.exit(1)

# 获取文件的元数据，包括CID
def get_file_metadata(bucket_name, s3_file_key):
    try:
        print(f"Fetching metadata for file '{s3_file_key}' in bucket '{bucket_name}'...")
        response = s3.head_object(Bucket=bucket_name, Key=s3_file_key)
        metadata = response.get('Metadata', {})

        if metadata:
            print("File metadata:", metadata)
            cid = metadata.get('cid', None)  # 假设 CID 被存储为元数据的一部分
            if cid:
                print(f"CID: {cid}")
            else:
                print("CID not found in metadata.")
        else:
            print("No custom metadata found for the file.")
    except ClientError as e:
        print(f"Error fetching metadata: {e}")
        sys.exit(1)

# 测试连接是否正常
def test_s3_connection():
    try:
        print("Testing S3 connection by listing buckets...")
        s3.list_buckets()
        print("S3 connection successful.")
    except Exception as e:
        print(f"Error in connecting to S3: {e}")
        sys.exit(1)

# 执行上传文件和获取CID的流程
test_s3_connection()  # 首先测试连接
upload_file_to_s3()    # 上传文件
get_file_metadata(bucket_name, s3_file_key)  # 获取元数据
