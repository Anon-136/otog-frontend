import { Divider, Flex, Link, Spacer, Text, Container } from '@chakra-ui/layout'
import { useToken } from '@chakra-ui/system'
import { CONTACT_LINK } from '@src/utils/config'

export function Footer() {
  const maxWidth = useToken('sizes', 'container')
  return (
    <Container maxWidth={maxWidth} mt={8} pb={4}>
      <Divider mb={2} />
      <Flex direction={{ base: 'column', sm: 'row' }}>
        <Text>
          หากมีข้อแนะนำ หรือข้อสงสัย{' '}
          <Link color="otog" href={CONTACT_LINK} target="_blank">
            ติดต่อเรา
          </Link>
        </Text>
        <Spacer />
        <Text>© 2021 Phakphum Dev Team</Text>
      </Flex>
    </Container>
  )
}
