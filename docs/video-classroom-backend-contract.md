# Video Classroom Backend Contract (Phase 1)

## Goal
Define the minimum backend fields for a Udemy-style student video classroom with sectioned playlist, progress, and lesson resources.

## Suggested Response Shape

```json
{
  "courseId": "string",
  "sections": [
    {
      "id": "string",
      "title": "string",
      "order": 1,
      "videos": [
        {
          "lessonId": "string",
          "moduleId": "string",
          "moduleTitle": "string",
          "title": "string",
          "order": 1,
          "duration": "12 min",
          "durationSeconds": 720,
          "description": "string",
          "summary": "string",
          "videoUrl": "https://...",
          "thumbnailUrl": "https://...",
          "provider": "youtube",
          "isCompleted": false,
          "isLocked": false,
          "keyPoints": ["string"],
          "captions": [
            {
              "id": "string",
              "language": "es",
              "url": "https://.../captions.vtt",
              "isDefault": true
            }
          ],
          "resources": [
            {
              "id": "string",
              "title": "string",
              "type": "pdf",
              "url": "https://..."
            }
          ]
        }
      ]
    }
  ],
  "progress": {
    "completedVideos": 3,
    "totalVideos": 12,
    "percent": 25,
    "autoplayEnabled": false,
    "lastLessonId": "string",
    "lastPositionSeconds": 148
  }
}
```

## Endpoints (Microservices)

- `GET /student/courses/{courseId}/video-classroom`
- `POST /student/courses/{courseId}/lessons/{lessonId}/progress`
- `POST /student/courses/{courseId}/lessons/{lessonId}/completion`

## Progress Payloads

### Update playback progress

```json
{
  "positionSeconds": 148,
  "durationSeconds": 720,
  "watchedPercent": 20.6
}
```

### Mark completion

```json
{
  "isCompleted": true,
  "source": "manual"
}
```

## Notes

- Keep `durationSeconds` as source of truth; `duration` can be derived for display.
- Include `isLocked` per lesson so frontend can disable unavailable videos.
- `resources` and `captions` are optional arrays and should default to `[]`.
- `progress.lastLessonId` and `progress.lastPositionSeconds` enable "Continue where you left off".
