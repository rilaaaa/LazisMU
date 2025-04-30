'use client'

import React, { useState, useCallback } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { uploadJurnal, MuzzakiJurnalUploadData } from '@/api/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { FileUploadModalProps } from '@/lib/types'

export function FileUploadModal({ isOpen, onClose, onUploadSuccess }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const base64String = await fileToBase64(selectedFile)
      const data: MuzzakiJurnalUploadData = {
        attachment_name: fileName,
        attachment_base64: base64String,
      }

      const res = await uploadJurnal(data)
      
      if (res) {
        toast({
          title: 'Upload successful',
          description: 'Your file has been uploaded successfully.',
        })
        onUploadSuccess()
        onClose()
      } else {
        toast({
          title: 'Upload failed',
          description: 'There was an error uploading your file. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: 'Upload failed',
        description: `There was an error uploading your file: ${error}. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, fileName, onClose, onUploadSuccess])

  const handleCancelFileSelection = useCallback(() => {
    setSelectedFile(null)
    setFileName('')
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto w-[calc(100%-2rem)] sm:w-full rounded">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 px-2 sm:px-4">
          <div className="flex items-center gap-4">
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls, .csv"
              className="sr-only"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {selectedFile ? selectedFile.name : 'Choose file'}
            </label>
            {selectedFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelFileSelection}
              >
                Cancel
              </Button>
            )}
          </div>
          {selectedFile && (
            <Input
              type="text"
              id="file-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="File name"
            />
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? 'Uploading...' : 'Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64String = result.split(',')[1]
      resolve(base64String)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default FileUploadModal;

