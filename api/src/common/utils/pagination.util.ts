import type { Response } from 'express';

export function setPaginationHeaders(options: {
  res: Response;
  baseUrl: string;
  query: Record<string, any>;
  total: number;
  page: number;
  pageSize: number;
}) {
  const { res, baseUrl, query, total, page, pageSize } = options;
  res.setHeader('X-Total-Count', String(total));

  const pageCount = Math.max(0, Math.ceil(total / pageSize));
  const buildUrl = (p: number) => {
    const url = new URL(baseUrl, 'http://placeholder');
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (k !== 'page' && k !== 'pageSize') url.searchParams.set(k, String(v));
    });
    url.searchParams.set('page', String(p));
    url.searchParams.set('pageSize', String(pageSize));
    // Remove placeholder origin for relative link
    return url.pathname + (url.search ? url.search : '');
  };

  const links: string[] = [];
  if (pageCount > 0) {
    links.push(`<${buildUrl(1)}>; rel="first"`);
    links.push(`<${buildUrl(pageCount)}>; rel="last"`);
    if (page > 1) links.push(`<${buildUrl(page - 1)}>; rel="prev"`);
    if (page < pageCount) links.push(`<${buildUrl(page + 1)}>; rel="next"`);
  }
  if (links.length) res.setHeader('Link', links.join(', '));
}
