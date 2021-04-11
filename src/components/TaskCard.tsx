import { Button, IconButton } from '@chakra-ui/button'
import { useDisclosure } from '@chakra-ui/hooks'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  EditIcon,
} from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Divider,
  Heading,
  HStack,
  Link,
  Spacer,
  Stack,
  Text,
} from '@chakra-ui/layout'
import { Select } from '@chakra-ui/select'
import { Spinner } from '@chakra-ui/spinner'
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table'
import { Collapse } from '@chakra-ui/transition'
import Editor from '@monaco-editor/react'
import { API_HOST } from '@src/utils/api'
import { useHttp } from '@src/utils/api/HttpProvider'
import { Problem } from '@src/utils/api/Problem'
import {
  SubmissionWithProblem,
  useProblemSubmission,
} from '@src/utils/api/Submission'
import { useToastError } from '@src/utils/hooks/useError'
import {
  isGraded,
  isGrading,
  useStatusColor,
} from '@src/utils/hooks/useStatusColor'
import { ONE_SECOND } from '@src/utils/hooks/useTimer'
import { ChangeEvent, memo, useRef, useState } from 'react'

import { CodeModal, ErrorModal } from './CodeModal'
import { FileInput } from './FileInput'
import { OrangeButton } from './OrangeButton'

const defaultValue = `#include <iostream>

using namespace std;

int main() {
    return 0;
}`

export interface TaskCardProps {
  problem: Problem
  contestId: number
}

export const TaskCard = memo((props: TaskCardProps) => {
  const { problem } = props
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true })
  const { isOpen: isEditorOpen, onToggle: onEditorToggle } = useDisclosure()
  const { data: submission } = useProblemSubmission(problem.id)

  return (
    <Box rounded="lg" boxShadow="sm" borderWidth="1px">
      <Button
        p={{ base: 2, sm: 6 }}
        justifyContent="space-between"
        borderBottomRadius={isOpen ? 0 : 'md'}
        variant="ghost"
        width="100%"
        onClick={onToggle}
        rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      >
        <HStack>
          <Heading as="h3" size="md">
            {problem.name}
          </Heading>
          {submission?.status === 'accept' && (
            <Badge colorScheme="green">Solved</Badge>
          )}
        </HStack>
      </Button>
      <Collapse in={isOpen}>
        <Divider />
        <Stack p={{ base: 2, sm: 6 }} pt={{ sm: 4 }} spacing={4}>
          <HStack>
            <Box flex={1}>
              <Link
                href={`${API_HOST}problem/doc/${problem.id}`}
                target="_blank"
                color="otog"
              >
                [ดาวน์โหลด]
              </Link>
              <Text fontSize="sm">
                ({problem.timeLimit / ONE_SECOND} วินาที {problem.memoryLimit}{' '}
                MB)
              </Text>
            </Box>
            <IconButton
              aria-label="toggle-code-editor"
              icon={isEditorOpen ? <CloseIcon /> : <EditIcon />}
              size="sm"
              variant="ghost"
              onClick={onEditorToggle}
            />
          </HStack>
          <Collapse in={isEditorOpen}>
            <ContestEditorForm {...props} />
          </Collapse>
          <Collapse in={!isEditorOpen}>
            <ContestFileForm {...props} />
          </Collapse>
          <Collapse in={!!submission}>
            {submission && <TaskSubmissionTable submission={submission} />}
          </Collapse>
        </Stack>
      </Collapse>
    </Box>
  )
})

export type ContestFileFormProps = TaskCardProps

export function ContestFileForm(props: ContestFileFormProps) {
  const { problem, contestId } = props

  const { mutate } = useProblemSubmission(problem.id)
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File>()
  const onFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length === 0) return
    setFile(e.target.files?.[0])
  }

  const [language, setLanguage] = useState<string>('cpp')
  const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value)
  }

  const http = useHttp()
  const { onError } = useToastError()
  const onFileSubmit = async () => {
    if (file) {
      const formData = new FormData()
      formData.append('contestId', `${contestId}`)
      formData.append('language', language)
      formData.append('sourceCode', file)
      try {
        await http.post(`submission/problem/${problem.id}`, formData)
        mutate()
        setFile(undefined)
        if (inputRef.current) inputRef.current.value = ''
      } catch (e) {
        onError(e)
      }
    }
  }
  return (
    <Stack
      direction={{ base: 'column', sm: 'row' }}
      spacing={{ base: 2, sm: 8 }}
    >
      <Select name="language" size="sm" flex={1} onChange={onSelectChange}>
        <option value="cpp">C++</option>
        <option value="c">C</option>
        <option value="python">Python</option>
      </Select>
      <HStack justify="flex-end">
        <FileInput
          ref={inputRef}
          size="sm"
          name="sourceCode"
          fileName={file?.name}
          onChange={onFileSelect}
          accept=".c,.cpp,.py"
        />
        <OrangeButton size="sm" onClick={onFileSubmit}>
          ส่ง
        </OrangeButton>
      </HStack>
    </Stack>
  )
}

const extension: Record<string, string> = {
  cpp: '.cpp',
  c: '.c',
  python: '.py',
}

export type ContestEditorFormProps = TaskCardProps

export function ContestEditorForm(props: ContestEditorFormProps) {
  const { problem, contestId } = props
  const { mutate } = useProblemSubmission(problem.id)

  const [language, setLanguage] = useState<string>('cpp')
  const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value)
  }

  const [value, setValue] = useState<string>()
  const onEditorChange = (value: string | undefined) => {
    setValue(value)
  }

  const http = useHttp()
  const { onError } = useToastError()
  const onSubmit = async () => {
    if (value) {
      const blob = new Blob([value])
      const file = new File([blob], `${problem.id}${extension[language]}`)

      const formData = new FormData()
      formData.append('contestId', `${contestId}`)
      formData.append('sourceCode', file)
      formData.append('language', language)
      try {
        await http.post(`submission/problem/${problem.id}`, formData)
        mutate()
      } catch (e) {
        onError(e)
      }
    }
  }

  return (
    <Stack>
      <Editor
        height="60vh"
        language={language}
        theme="vs-dark"
        defaultValue={defaultValue}
        onChange={onEditorChange}
      />
      <Stack direction="row" spacing={{ base: 2, sm: 8 }}>
        <Select name="language" size="sm" flex={1} onChange={onSelectChange}>
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="python">Python</option>
        </Select>
        <Spacer />
        <Box flex={1}>
          <OrangeButton size="sm" width="100%" onClick={onSubmit}>
            ส่ง
          </OrangeButton>
        </Box>
      </Stack>
    </Stack>
  )
}

export interface TaskSubmissionTableProps {
  submission: SubmissionWithProblem
}

export function TaskSubmissionTable(props: TaskSubmissionTableProps) {
  const { submission } = props
  const bg = useStatusColor(submission)

  const {
    isOpen: isErrorOpen,
    onOpen: onErrorOpen,
    onClose: onErrorClose,
  } = useDisclosure()

  const {
    isOpen: isCodeOpen,
    onOpen: onCodeOpen,
    onClose: onCodeClose,
  } = useDisclosure()

  return (
    <Box overflowX="auto">
      <Table size="sm">
        <Thead>
          <Tr>
            <Th px={5}>#</Th>
            <Th>ผลตรวจ</Th>
            <Th>เวลารวม</Th>
            <Th>คะแนน</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr bg={bg}>
            <Td>
              <Button variant="ghost" onClick={onCodeOpen} px={1} size="sm">
                ล่าสุด
              </Button>
              <CodeModal
                submissionId={submission.id}
                isOpen={isCodeOpen}
                onClose={onCodeClose}
              />
            </Td>
            <Td>
              {submission.errmsg ? (
                <>
                  <Button
                    px={1}
                    variant="ghost"
                    onClick={onErrorOpen}
                    size="sm"
                  >
                    {submission.result}
                  </Button>
                  <ErrorModal
                    isOpen={isErrorOpen}
                    onClose={onErrorClose}
                    submission={submission}
                  />
                </>
              ) : isGrading(submission) ? (
                <HStack>
                  <Spinner size="xs" />
                  <Text>{submission.result}</Text>
                </HStack>
              ) : isGraded(submission) ? (
                <code>{submission.result}</code>
              ) : (
                submission.result
              )}
            </Td>
            <Td>{submission.timeUsed / 1000} s</Td>
            <Td>{submission.score}</Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  )
}
