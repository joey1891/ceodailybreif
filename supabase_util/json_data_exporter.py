import os
import json
import glob
from dotenv import load_dotenv
from supabase import create_client
from typing import Dict, List, Any, Optional
import time

# .env 파일에서 환경 변수 로드
load_dotenv()

class SupabaseImporter:
    def __init__(self):
        # 환경 변수에서 Supabase 연결 정보 가져오기
        self.supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        # 서비스 롤 키 사용 (RLS 우회를 위함)
        self.supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env 파일에 없습니다.")

        print(f"Supabase {self.supabase_url}에 서비스 롤로 연결 중...")
        self.supabase = create_client(self.supabase_url, self.supabase_key)

    def import_folder_to_posts(self, folder_path: str, batch_size: int = 10) -> None:
        """폴더 내의 모든 JSON 파일을 읽어 posts 테이블에 가져옵니다."""
        try:
            # 폴더 내의 모든 JSON 파일 경로 가져오기 (디렉토리는 제외)
            json_files = [f for f in glob.glob(os.path.join(folder_path, "*.json")) if os.path.isfile(f)]
            if not json_files:
                print(f"오류: 폴더 '{folder_path}'에 JSON 파일이 없습니다.")
                return
            
            total_files = len(json_files)
            print(f"\n총 {total_files}개의 JSON 파일을 발견했습니다.")
            
            successful_imports = 0
            failed_imports = 0
            
            print("\nSupabase posts 테이블에 데이터 업로드 시작...")
            
            # 배치 단위로 파일 처리
            for i in range(0, total_files, batch_size):
                batch_files = json_files[i:i + batch_size]
                print(f"배치 {i//batch_size + 1}/{(total_files + batch_size - 1)//batch_size} 처리 중... ({i+1}-{min(i+batch_size, total_files)}/{total_files})")
                
                for file_path in batch_files:
                    try:
                        # JSON 파일 읽기
                        with open(file_path, 'r', encoding='utf-8') as f:
                            record = json.load(f)
                        
                        file_name = os.path.basename(file_path)
                        print(f"  파일 '{file_name}' 처리 중...")
                        
                        # posts 테이블에 삽입/업데이트
                        if 'id' in record:
                            response = self.supabase.table('posts').upsert(record).execute()
                            print(f"  레코드 ID {record.get('id')} 업데이트/삽입 완료")
                        else:
                            response = self.supabase.table('posts').insert(record).execute()
                            print(f"  새 레코드 삽입 완료")
                        
                        successful_imports += 1
                    except Exception as e:
                        print(f"  오류: 파일 '{os.path.basename(file_path)}' 처리 실패 - {e}")
                        failed_imports += 1
                
                # 과도한 API 요청 방지를 위한 딜레이
                if i + batch_size < total_files:
                    print("  API 제한 방지를 위해 잠시 대기 중...")
                    time.sleep(1)
            
            print("\n===== 데이터 가져오기 완료 =====")
            print(f"성공: {successful_imports}개 파일")
            print(f"실패: {failed_imports}개 파일")
            
        except Exception as e:
            print(f"오류: 폴더 데이터 가져오기 중 문제가 발생했습니다 - {e}")


def main():
    try:
        importer = SupabaseImporter()
        
        print("\n===== SUPABASE 포스트 데이터 가져오기 =====")
        
        # 기본 폴더 경로
        default_folder = "C:\\Users\\Jay\\Desktop\\Node\\my-homepage_bolt_2\\my-homepage_bolt\\supabase_data_json\\posts"
        
        # 사용자로부터 폴더 경로 입력받기
        folder_path = input(f"JSON 파일이 있는 폴더 경로 (기본값: {default_folder}): ").strip() or default_folder
        
        # 폴더 존재 확인
        if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
            print(f"오류: 폴더 '{folder_path}'가 존재하지 않거나 디렉토리가 아닙니다.")
            return
            
        # 폴더 내 JSON 파일 데이터 가져오기
        importer.import_folder_to_posts(folder_path)
            
    except Exception as e:
        print(f"오류: {e}")
        print("\n문제 해결 팁:")
        print("1. .env 파일에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 있는지 확인하세요.")
        print("2. Supabase URL과 키가 올바른지 확인하세요.")
        print("3. 필요한 Python 패키지가 설치되어 있는지 확인하세요:")
        print("   pip install python-dotenv supabase glob2")


if __name__ == "__main__":
    main()