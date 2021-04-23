import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import Comments from '../../components/Comments';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({
  post,
  preview,
  previousPost,
  nextPost,
}: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h2>Carregando...</h2>;
  }
  const HUMAN_ESTIMATED_NUMBER_OF_WORD_READ_PER_MINUTE = 200;

  const totalWordsQuantity = post.data.content.reduce(
    (wordsAccumulator, valorAtual) => {
      wordsAccumulator += RichText.asText(valorAtual.body).split(/\W+/).length;

      return wordsAccumulator;
    },
    0
  );
  const estimatedReadingTime = Math.ceil(
    totalWordsQuantity / HUMAN_ESTIMATED_NUMBER_OF_WORD_READ_PER_MINUTE
  );

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <main className={styles.container}>
        <h1>{post.data.title}</h1>
        <div className={commonStyles.postInfo}>
          <div>
            <span>
              <FiCalendar size={20} />
              {format(new Date(post.first_publication_date), 'PP', {
                locale: ptBR,
              })}
            </span>
            <span>
              <FiUser size={20} />
              {post.data.author}
            </span>
            <span>
              <FiClock size={20} />
              {estimatedReadingTime} min
            </span>
          </div>
          {post.last_publication_date !== post.first_publication_date && (
            <p>
              {format(
                parseISO(post.last_publication_date),
                "'*editado em' dd MMM yyyy', às' HH:mm",
                {
                  locale: ptBR,
                }
              )}
            </p>
          )}
        </div>
        {post.data.content.map(content => (
          <article key={content.heading} className={styles.postContent}>
            <h2>{content.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </article>
        ))}
        <hr />
        <nav className={styles.navigate}>
          {previousPost && (
            <div>
              <Link href={`/post/${previousPost.uid}`}>
                <a>
                  <p>{previousPost.title}</p>
                </a>
              </Link>
              <span>Previous post</span>
            </div>
          )}
          {nextPost && (
            <div className={styles.nextPost}>
              <Link href={`/post/${nextPost.uid}`}>
                <a>
                  <p>{nextPost.title}</p>
                </a>
              </Link>
              <span>Next post</span>
            </div>
          )}
        </nav>
        <footer>
          <Comments />
        </footer>
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

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);
  const postsPaths = posts.results.map(postPath => ({
    params: { slug: postPath.uid },
  }));
  return {
    paths: postsPaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const previousPostResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPostResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const previousPost =
    previousPostResponse.results.length > 0
      ? {
          uid: previousPostResponse.results[0]?.uid,
          title: previousPostResponse.results[0]?.data?.title,
        }
      : null;

  const nextPost =
    nextPostResponse.results.length > 0
      ? {
          uid: nextPostResponse.results[0]?.uid,
          title: nextPostResponse.results[0]?.data?.title,
        }
      : null;

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };
  console.log(response.data.banner);
  return {
    props: { post, preview, previousPost, nextPost },
  };
};
