import { getSessionUser } from '../../utils/auth'
import { uploadToMinio } from '../../utils/minio'

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '未授权'
    })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '未提供文件'
    })
  }

  const file = formData.find(item => item.name === 'avatar')
  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: '未找到头像文件'
    })
  }

  try {
    const avatarUrl = await uploadToMinio(file.data, file.filename || 'avatar.png', file.type || 'image/png')
    return { avatarUrl }
  } catch (err: any) {
    console.error('MinIO Upload Error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: '头像上传失败: ' + err.message
    })
  }
})
