@echo off
echo JSON 예시 파일 생성 중...

REM admin_users 테이블 예시
echo {^
  "username": "admin1",^
  "email": "admin1@example.com",^
  "full_name": "관리자 1",^
  "is_active": true,^
  "created_at": "2023-10-01T12:00:00Z"^
} > data_json\admin_users\example_admin.json

REM calendar_events 테이블 예시
echo {^
  "title": "주간 회의",^
  "description": "팀 프로젝트 진행 상황 검토",^
  "start_time": "2023-10-15T14:00:00Z",^
  "end_time": "2023-10-15T15:00:00Z",^
  "is_all_day": false,^
  "created_by": 1^
} > data_json\calendar_events\example_event.json

REM comments 테이블 예시
echo {^
  "post_id": 1,^
  "content": "좋은 글입니다. 많은 도움이 되었습니다.",^
  "author_name": "사용자1",^
  "email": "user1@example.com",^
  "is_approved": true,^
  "created_at": "2023-10-10T09:30:00Z"^
} > data_json\comments\example_comment.json

REM page_contents 테이블 예시
echo {^
  "page_id": 1,^
  "content_type": "text",^
  "content": "이 페이지는 회사 소개 페이지입니다.",^
  "order": 1,^
  "is_active": true,^
  "last_updated": "2023-09-25T11:20:00Z"^
} > data_json\page_contents\example_content.json

REM page_sections 테이블 예시
echo {^
  "page_id": 1,^
  "title": "회사 소개",^
  "section_key": "about_company",^
  "description": "회사의 역사와 비전에 대한 소개",^
  "order": 1,^
  "is_visible": true^
} > data_json\page_sections\example_section.json

REM posts 테이블 예시
echo {^
  "title": "Supabase로 데이터베이스 관리하기",^
  "slug": "managing-database-with-supabase",^
  "content": "이 글에서는 Supabase를 사용하여 데이터베이스를 효율적으로 관리하는 방법에 대해 알아봅니다.",^
  "excerpt": "Supabase 데이터베이스 관리 가이드",^
  "is_published": true,^
  "published_at": "2023-10-05T08:00:00Z",^
  "author_id": 1,^
  "category": "개발",^
  "read_time": 5^
} > data_json\posts\example_post.json

REM related_links 테이블 예시
echo {^
  "source_id": 1,^
  "source_type": "post",^
  "target_id": 2,^
  "target_type": "post",^
  "relation_type": "related",^
  "order": 1,^
  "created_at": "2023-09-30T14:45:00Z"^
} > data_json\related_links\example_link.json

REM url_mappings 테이블 예시
echo {^
  "source_url": "/old-path",^
  "target_url": "/new-path",^
  "status_code": 301,^
  "is_active": true,^
  "created_at": "2023-09-15T10:30:00Z",^
  "notes": "웹사이트 리뉴얼 후 리다이렉트"^
} > data_json\url_mappings\example_mapping.json

echo JSON 예시 파일 생성 완료! 