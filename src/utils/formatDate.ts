import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export function publicationDateFormat(publicationDate: string): string {
  return format(new Date(publicationDate), 'PP', {
    locale: ptBR,
  });
}

export function editDateFormat(editDate: string): string {
  return format(parseISO(editDate), "'*editado em' dd MMM yyyy', às' HH:mm", {
    locale: ptBR,
  });
}
