'use client'

import React, { useState, useCallback } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
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
  const [kategori, setKategori] = useState('')

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name)
    }
  }, [])

  const handleImport = useCallback(async () => {
  if (!selectedFile || !kategori) return

  setIsUploading(true)
  try {
    const dataBuffer = await selectedFile.arrayBuffer()

    const base64String = btoa(
      new Uint8Array(dataBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    )

    const workbook = XLSX.read(dataBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    const sheetData: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
    })

    const headers = sheetData[0]
    const rows = sheetData.slice(1)

    const formattedData = rows.map((row) => {
      const rowObj: any = {}
      headers.forEach((header: string, idx: number) => {
        rowObj[header] = row[idx]
      })

      return {
        nama: rowObj['Nama Donatur'] || rowObj['nama'] || '',
        hp: rowObj['No HP'] || rowObj['hp'] || '',
        jumlah: parseFloat(rowObj['Jumlah']) || 0,
        kategori,
      }
    })

    const data: MuzzakiJurnalUploadData = {
      attachment_name: selectedFile.name,
      attachment_base64: base64String,
      jenisJurnal: kategori,
      data: formattedData,
    }

    const res = await uploadJurnal(data)

    if (res) {
      toast({
        title: 'Upload berhasil',
        description: 'Data dari file berhasil diunggah.',
      })
      onUploadSuccess()
      onClose()
    } else {
      toast({
        title: 'Gagal upload',
        description: 'Terjadi kesalahan saat mengunggah data.',
        variant: 'destructive',
      })
    }
  } catch (error) {
    console.error('Upload error:', error)
    toast({
      title: 'Upload gagal',
      description: `Terjadi kesalahan saat membaca file: ${error}`,
      variant: 'destructive',
    })
  } finally {
    setIsUploading(false)
  }
}, [selectedFile, kategori, onClose, onUploadSuccess])



  const handleCancelFileSelection = useCallback(() => {
    setSelectedFile(null)
    setFileName('')
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto w-[calc(100%-2rem)] sm:w-full rounded">
        <DialogHeader>
          <DialogTitle>Upload File Excel</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 px-2 sm:px-4">
          <div className="flex items-center gap-4">
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls"
              className="sr-only"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {selectedFile ? selectedFile.name : 'Pilih file'}
            </label>
            {selectedFile && (
              <Button variant="outline" size="sm" onClick={handleCancelFileSelection}>
                Batal
              </Button>
            )}
          </div>

          {selectedFile && (
            <Input
              type="text"
              id="file-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Nama file"
            />
          )}

          {/* Pilihan Kategori */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Kategori</span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="kategori"
                value="perhimpunan"
                checked={kategori === 'perhimpunan'}
                onChange={() => setKategori('perhimpunan')}
              />
              Perhimpunan
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="kategori"
                value="penyaluran"
                checked={kategori === 'penyaluran'}
                onChange={() => setKategori('penyaluran')}
              />
              Penyaluran
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Batal
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isUploading || !kategori}
            className="w-full sm:w-auto"
          >
            {isUploading ? 'Mengunggah...' : 'Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FileUploadModal
