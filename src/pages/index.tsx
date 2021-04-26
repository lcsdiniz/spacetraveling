import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { publicationDateFormat } from '../utils/formatDate';

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
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [postsResults, setPostsResults] = useState<Post[]>(
    postsPagination.results.map(post => {
      return {
        ...post,
        first_publication_date: publicationDateFormat(
          post.first_publication_date
        ),
      };
    })
  );
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function fetchNextPage(): Promise<void> {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        const results = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: publicationDateFormat(
              post.first_publication_date
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
                <div>
                  <span>
                    <FiCalendar size={20} />
                    {post.first_publication_date}
                  </span>
                  <span>
                    <FiUser size={20} />
                    {post.data.author}
                  </span>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {nextPage === null ? null : (
          <button
            type="button"
            onClick={() => {
              fetchNextPage();
            }}
            className={styles.loadMorePostsButton}
          >
            Load more posts
          </button>
        )}
        {preview && (
          <div className={commonStyles.exitPreview}>
            <Link href="/api/exit-preview">
              <a>Exit preview mode</a>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
      ref: previewData?.ref ?? null,
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
      preview,
    },
  };
};
