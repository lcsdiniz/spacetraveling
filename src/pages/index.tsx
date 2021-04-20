import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [postsResults, setPostsResults] = useState<Post[]>(
    postsPagination.results.map(post => {
      return {
        ...post,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'PP',
          {
            locale: ptBR,
          }
        ),
      };
    })
  );
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function fetchNextPage(postPagination: PostPagination) {
    fetch(postPagination.next_page)
      .then(response => response.json())
      .then(data => {
        const results = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'PP',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setPostsResults(postsResults.concat(results));
        setNextPage(data.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <Header />
      <main className={styles.container}>
        {postsResults.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div className={commonStyles.postInfo}>
                <span>
                  <FiCalendar size={20} />
                  {post.first_publication_date}
                </span>
                <span>
                  <FiUser size={20} />
                  {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}
        {nextPage === null ? null : (
          <button
            type="button"
            onClick={() => {
              fetchNextPage(postsPagination);
            }}
            className={styles.loadMorePostsButton}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      // fetch: ['post.title', 'post.content'],
      pageSize: 1,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    results,
    next_page: postsResponse.next_page,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
