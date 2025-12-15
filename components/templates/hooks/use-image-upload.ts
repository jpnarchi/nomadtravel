/**
 * Hook para gestionar la subida de imágenes
 */

import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'

export function useImageUpload() {
    const [isUploading, setIsUploading] = useState(false)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const saveImage = useMutation(api.files.saveImage)

    const uploadImage = useCallback(async (file: File): Promise<string | null> => {
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen')
            return null
        }

        setIsUploading(true)
        toast.info('Adding image...')

        try {
            const uploadUrl = await generateUploadUrl()

            const result = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            })

            if (!result.ok) {
                throw new Error('Failed to upload file')
            }

            const { storageId } = await result.json()
            const { url } = await saveImage({ storageId })

            return url
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Error al subir la imagen')
            return null
        } finally {
            setIsUploading(false)
        }
    }, [generateUploadUrl, saveImage])

    const uploadFromClipboard = useCallback(async (blob: Blob): Promise<string | null> => {
        setIsUploading(true)
        toast.info('Subiendo imagen desde portapapeles...')

        try {
            const uploadUrl = await generateUploadUrl()

            const result = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': blob.type },
                body: blob,
            })

            if (!result.ok) {
                throw new Error('Failed to upload file')
            }

            const { storageId } = await result.json()
            const { url } = await saveImage({ storageId })

            return url
        } catch (error) {
            console.error('Error uploading pasted image:', error)
            toast.error('Error al subir la imagen')
            return null
        } finally {
            setIsUploading(false)
        }
    }, [generateUploadUrl, saveImage])

    return {
        isUploading,
        uploadImage,
        uploadFromClipboard
    }
}
