import { reactive } from 'vue'

// 各檔案的儲存狀態，切頁不清除
export const fileStatuses = reactive({})

export function setStatus(filename, status) {
  fileStatuses[filename] = status
}
