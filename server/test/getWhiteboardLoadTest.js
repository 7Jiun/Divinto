import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10, // 虛擬用戶數量
  duration: '2s', // 測試持續時間
};

const testToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1Nzk3ZDg5NzdjMmNiMTdhMzE0YmU1MSIsIm5hbWUiOiJkZW1vIiwiaWF0IjoxNzAyNjA5OTU4LCJleHAiOjE3MDYyMDk5NTh9.hnMTsyQEQQy7yLmAmhRzJ-gT4M4wzCZmOFERb0DOPsM';

export default function () {
  const whiteboardId = '6580f6a0d8766d6813baf19e';
  const params = {
    headers: {
      Authorization: `Bearer ${testToken}`,
    },
  };
  const res = http.get(`http://localhost:3000/api/whiteboard/${whiteboardId}`, params);
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
