import { useRouter } from "next/router";
import { request, gql } from "graphql-request";
import { Box, SimpleGrid, ListItem, List, Image } from "@chakra-ui/react";
import { getImage } from "../utils/getImage";

const URL = "https://hub.snapshot.org/graphql";
const fetcher = (query) => request(URL, query);
export const getStaticPaths = async () => {
  const spacesQuery = `
  {
    spaces(
      first: 20,
      skip: 0,
      orderBy: "created",
      orderDirection: desc
    ) {
      id
    }
  }
  `;
  const res = await fetcher(spacesQuery);
  const paths = res.spaces.map((spaces) => {
    return {
      params: { space: spaces.id },
    };
  });
  return {
    paths,
    fallback: true,
  };
};
export const getStaticProps = async ({ params }) => {
  const spaceQuery = gql`
  {
      space(id: "${params.space}") {
        id
        name
        about
        symbol
        avatar
      }
    }
  `;
  const proposalsQuery = gql`
  {
    proposals(
      first: 20, 
      skip:0, 
      where: {
        space: "${params.space}"
      }, 
      orderBy: "created", 
      orderDirection: desc
    ) {
      id
      title
      body
      choices
      start
      end
      snapshot
      state
      author
      space {
        id
        name
      }
    }
  }
  `;
  const votesQuery = gql`
  {
    votes(
      first: 100
      skip: 0
      where: {
        space: "${params.space}"
      },
      orderBy: "created",
      orderDirection: desc
    ) {
      id
      voter
      created
      choice
      space {
        id
      }
    }
  }
  `;

  const data = await request(URL, spaceQuery);
  if (!data.space) {
    return {
      notFound: true,
    };
  }
  const proposalsData = await request(URL, proposalsQuery);
  const votesData = await request(URL, votesQuery);
  return {
    props: {
      space: data.space,
      proposals: proposalsData.proposals,
      votes: votesData.votes,
    },
  };
};

const Space = ({ space, proposals, votes }) => {
  const router = useRouter();
  if (router.isFallback) return <h1>Loading...</h1>;
  const { symbol, name, about, avatar } = space;
  const image = getImage(avatar);
  console.log(space);
  console.log(votes);
  console.log(proposals);
  const uniqueVotes = [...new Set(votes.map((vote) => vote.id))];
  return (
    <SimpleGrid>
      <SimpleGrid height="32vh" background="yellow" padding={10}>
        <Box>
          <Image
            src={image}
            height="100px"
            sx={{ display: "inline" }}
            paddingRight="4"
          />
          <Box fontSize="6xl">{symbol}</Box>
        </Box>
        <Box fontSize="3xl">{name}</Box>
        <Box>{about}</Box>
      </SimpleGrid>
      <SimpleGrid height="16vh" background="pink" paddingX={8} columns={3}>
        <SimpleGrid>
          <Box fontSize="large">Number of Unique Voters:</Box>
          <Box fontSize="6xl">{uniqueVotes.length}</Box>
        </SimpleGrid>
        <SimpleGrid>
          <Box fontSize="large">Average Voting Power: </Box>
          <Box fontSize="6xl"></Box>
        </SimpleGrid>
        <SimpleGrid>
          <Box fontSize="large">Voting Power vs Actual Number of People:</Box>
          <Box fontSize="6xl"></Box>
        </SimpleGrid>
      </SimpleGrid>
      <List
        background="green"
        padding="6"
        spacing={3}
        height="50vh"
        sx={{ overflowY: "scroll" }}
      >
        {proposals.map((proposal) => {
          return (
            <ListItem key={proposal.id}>
              <Box>{proposal.title}</Box>
              <Box>{proposal.state}</Box>
              <Box>{proposal.author}</Box>
            </ListItem>
          );
        })}
      </List>
    </SimpleGrid>
  );
};

export default Space;
