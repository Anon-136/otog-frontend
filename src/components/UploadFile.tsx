import { useRef } from 'react'
import {
  Button,
  Input,
  InputGroup,
  InputProps,
  InputRightAddon,
} from '@chakra-ui/react'

export interface UploadFileProps extends InputProps {
  fileName?: string
}

export function UploadFile(props: UploadFileProps) {
  const { fileName, ...rest } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const openFileSelect = () => inputRef.current?.click()

  return (
    <InputGroup>
      <Input type="file" ref={inputRef} display="none" {...rest} />
      <Input
        value={fileName ?? 'ยังไม่ได้เลือกไฟล์'}
        isReadOnly
        onClick={openFileSelect}
      />
      <InputRightAddon
        as={Button}
        fontWeight="normal"
        children="ค้นหาไฟล์"
        onClick={openFileSelect}
      />
    </InputGroup>
  )
}
