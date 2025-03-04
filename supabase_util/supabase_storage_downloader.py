import os
import sys
import requests
from dotenv import load_dotenv
from supabase import create_client
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from datetime import datetime
import concurrent.futures
import shutil
import time

# .env 파일에서 환경 변수 로드
load_dotenv()

class SupabaseStorageDownloader:
    def __init__(self):
        # 환경 변수에서 Supabase 연결 정보 가져오기
        self.supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        self.supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 .env 파일에 없습니다.")
        
        print(f"Supabase {self.supabase_url}에 연결 중...")
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        
        # 다운로드 폴더 설정
        self.download_dir = "supabase_images"
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)
            print(f"'{self.download_dir}' 폴더가 생성되었습니다.")
    
    def list_buckets(self) -> List[Dict[str, Any]]:
        """Supabase Storage의 모든 버킷 목록을 가져옵니다."""
        try:
            response = self.supabase.storage.list_buckets()
            return response
        except Exception as e:
            print(f"버킷 목록을 가져오는 중 오류 발생: {e}")
            return []
    
    def list_files(self, bucket_name: str, path: str = "") -> List[Dict[str, Any]]:
        """특정 버킷 내의 파일 목록을 가져옵니다."""
        try:
            response = self.supabase.storage.from_(bucket_name).list(path)
            return response
        except Exception as e:
            print(f"{bucket_name} 버킷의 파일 목록을 가져오는 중 오류 발생: {e}")
            return []
    
    def download_file(self, bucket_name: str, file_path: str, download_path: str) -> bool:
        """파일을 다운로드합니다."""
        try:
            # 다운로드할 파일의 URL 생성
            file_url = self.supabase.storage.from_(bucket_name).get_public_url(file_path)
            
            # 폴더가 존재하지 않으면 생성
            os.makedirs(os.path.dirname(download_path), exist_ok=True)
            
            # 파일 다운로드
            response = requests.get(file_url, stream=True)
            if response.status_code == 200:
                with open(download_path, 'wb') as f:
                    response.raw.decode_content = True
                    shutil.copyfileobj(response.raw, f)
                return True
            else:
                print(f"파일 다운로드 실패: {file_path} (상태 코드: {response.status_code})")
                return False
        except Exception as e:
            print(f"파일 다운로드 중 오류 발생: {file_path} - {e}")
            return False
    
    def download_all_images(self, bucket_name: str = "images", path: str = "", max_workers: int = 5):
        """버킷 내의 모든 이미지 파일을 다운로드합니다."""
        # 파일 목록 가져오기
        files = self.list_files(bucket_name, path)
        if not files:
            print(f"{bucket_name} 버킷에서 파일을 찾을 수 없습니다.")
            return
        
        # 폴더와 파일 분리
        folders = [f for f in files if f.get("id") is None]
        image_files = [f for f in files if self._is_image_file(f.get("name", ""))]
        
        print(f"{bucket_name} 버킷에서 {len(folders)}개의 폴더와 {len(image_files)}개의 이미지 파일을 찾았습니다.")
        
        # 현재 경로의 이미지 파일 다운로드
        if image_files:
            self._download_files_parallel(bucket_name, path, image_files, max_workers)
        
        # 하위 폴더 재귀적으로 처리
        for folder in folders:
            folder_path = os.path.join(path, folder["name"]) if path else folder["name"]
            self.download_all_images(bucket_name, folder_path, max_workers)
    
    def _download_files_parallel(self, bucket_name: str, base_path: str, files: List[Dict[str, Any]], max_workers: int):
        """여러 파일을 병렬로 다운로드합니다."""
        total_files = len(files)
        completed = 0
        failed = 0
        
        start_time = time.time()
        print(f"{base_path or '루트'} 경로에서 {total_files}개의 파일 다운로드 시작...")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_file = {}
            
            for file_info in files:
                file_name = file_info.get("name", "")
                if not file_name:
                    continue
                
                file_path = os.path.join(base_path, file_name) if base_path else file_name
                download_path = os.path.join(self.download_dir, bucket_name, file_path)
                
                future = executor.submit(
                    self.download_file, 
                    bucket_name, 
                    file_path, 
                    download_path
                )
                future_to_file[future] = file_path
            
            for future in concurrent.futures.as_completed(future_to_file):
                file_path = future_to_file[future]
                try:
                    success = future.result()
                    if success:
                        completed += 1
                    else:
                        failed += 1
                except Exception as e:
                    print(f"파일 다운로드 실패: {file_path} - {e}")
                    failed += 1
                
                # 진행 상황 표시
                self._print_progress(completed, failed, total_files)
        
        elapsed_time = time.time() - start_time
        print(f"\n다운로드 완료: {completed}개 성공, {failed}개 실패 (소요 시간: {elapsed_time:.2f}초)")
    
    def _print_progress(self, completed: int, failed: int, total: int):
        """진행 상황을 출력합니다."""
        progress = (completed + failed) / total * 100
        sys.stdout.write(f"\r진행 상황: {completed}개 완료, {failed}개 실패 ({progress:.1f}%)")
        sys.stdout.flush()
    
    def _is_image_file(self, filename: str) -> bool:
        """파일이 이미지 파일인지 확인합니다."""
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
        file_ext = os.path.splitext(filename.lower())[1]
        return file_ext in image_extensions
    
    def download_specific_bucket(self):
        """특정 버킷의 모든 이미지를 다운로드합니다."""
        buckets = self.list_buckets()
        if not buckets:
            print("사용 가능한 버킷이 없습니다.")
            return
        
        print("\n사용 가능한 버킷:")
        for i, bucket in enumerate(buckets, 1):
            print(f"{i}. {bucket.get('name')}")
        
        # 기본값으로 'images' 버킷 찾기
        default_index = next((i for i, bucket in enumerate(buckets) 
                             if bucket.get('name') == 'images'), None)
        
        if default_index is not None:
            print(f"\n기본값: {default_index + 1}. images")
        
        bucket_choice = input("\n다운로드할 버킷 번호를 선택하세요 (Enter를 누르면 'images' 선택): ")
        
        if not bucket_choice and default_index is not None:
            selected_bucket = buckets[default_index].get('name')
        else:
            try:
                bucket_index = int(bucket_choice) - 1
                if 0 <= bucket_index < len(buckets):
                    selected_bucket = buckets[bucket_index].get('name')
                else:
                    print("잘못된 버킷 번호입니다.")
                    return
            except ValueError:
                if default_index is not None:
                    selected_bucket = buckets[default_index].get('name')
                else:
                    print("유효한 버킷 번호를 입력해주세요.")
                    return
        
        max_workers = input("\n동시 다운로드 스레드 수 (기본값: 5): ")
        max_workers = int(max_workers) if max_workers.isdigit() else 5
        
        # 타임스탬프로 다운로드 폴더 이름 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.download_dir = f"supabase_images_{selected_bucket}_{timestamp}"
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)
            print(f"'{self.download_dir}' 폴더가 생성되었습니다.")
        
        print(f"\n{selected_bucket} 버킷의 모든 이미지 다운로드를 시작합니다...")
        self.download_all_images(selected_bucket, "", max_workers)

def main():
    try:
        downloader = SupabaseStorageDownloader()
        
        print("\n===== Supabase Storage 이미지 다운로더 =====")
        print("1. 모든 버킷 목록 보기")
        print("2. 'images' 버킷의 모든 이미지 다운로드")
        print("3. 특정 버킷 선택하여 다운로드")
        
        choice = input("\n작업을 선택하세요 (1-3): ")
        
        if choice == "1":
            buckets = downloader.list_buckets()
            print("\n사용 가능한 버킷:")
            if buckets:
                for i, bucket in enumerate(buckets, 1):
                    print(f"{i}. {bucket.get('name')}")
            else:
                print("사용 가능한 버킷이 없습니다.")
                
        elif choice == "2":
            downloader.download_all_images("images")
            
        elif choice == "3":
            downloader.download_specific_bucket()
            
        else:
            print("잘못된 선택입니다.")
            
    except Exception as e:
        print(f"오류: {e}")
        print("\n문제 해결 팁:")
        print("1. .env 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY가 있는지 확인하세요.")
        print("2. Supabase URL과 키가 올바른지 확인하세요.")
        print("3. 필요한 Python 패키지가 설치되어 있는지 확인하세요:")
        print("   pip install python-dotenv supabase requests")

if __name__ == "__main__":
    main() 