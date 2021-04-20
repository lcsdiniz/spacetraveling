import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h2>Carregando...</h2>;
  }
  const HUMAN_ESTIMATED_NUMBER_OF_WORD_READ_PER_MINUTE = 200;
  // const formattedDate = format(new Date(post.first_publication_date), 'PP', {
  //   locale: ptBR,
  // });
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
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={styles.container}>
        <h1>{post.data.title}</h1>
        <div className={commonStyles.postInfo}>
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

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;

  const response = await prismic.getByUID('posts', String(slug), {});
  const post = {
    first_publication_date: response.first_publication_date,
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

  return {
    props: { post },
  };
};
