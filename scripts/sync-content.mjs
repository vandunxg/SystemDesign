import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viRoot = path.join(root, 'vi');
const contentRoot = path.join(root, 'content', 'docs');
const publicImages = path.join(root, 'public', 'images');

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function chapterInfo(relativePath) {
  const match = relativePath.match(/^((?:Volume2\/)?)CHAPTER\s+(\d+)[：:](.+)\.md$/u);
  if (!match) return null;

  const volume = match[1] ? 'volume-2' : 'volume-1';
  const number = Number(match[2]);
  const titleSlug = slugify(match[3]);
  return {
    number,
    volume,
    route: `${volume}/chapter-${String(number).padStart(2, '0')}-${titleSlug}`,
  };
}

function sourceTargetPairs() {
  const pairs = [];
  const rootEntries = fs.existsSync(viRoot) ? fs.readdirSync(viRoot) : [];
  const volumeEntries = fs.existsSync(path.join(viRoot, 'Volume2'))
    ? fs.readdirSync(path.join(viRoot, 'Volume2'))
    : [];

  for (const filename of rootEntries) {
    if (!filename.startsWith('CHAPTER ') || !filename.endsWith('.md')) continue;
    const relativePath = filename;
    const info = chapterInfo(relativePath);
    if (info) pairs.push({ relativePath, info });
  }

  for (const filename of volumeEntries) {
    if (!filename.startsWith('CHAPTER ') || !filename.endsWith('.md')) continue;
    const relativePath = path.join('Volume2', filename).replaceAll(path.sep, '/');
    const info = chapterInfo(relativePath);
    if (info) pairs.push({ relativePath, info });
  }

  return pairs.sort((a, b) =>
    a.info.volume.localeCompare(b.info.volume) || a.info.number - b.info.number,
  );
}

function stripMarkdown(value) {
  return value
    .replace(/[`*_>#]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function metadataFor(body, fallbackTitle) {
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fallbackTitle;
  const description = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#') && !line.startsWith('```'));

  return {
    title: stripMarkdown(heading),
    description: stripMarkdown(description ?? heading).slice(0, 160),
  };
}

function normalizeImageLinks(body) {
  return body.replace(/(!?\[(.*?)\]\()([^\)\n]+)(\))/g, (match, open, alt, target, close) => {
    const decoded = target.replaceAll(/%2F/gi, '/');
    const normalized = decoded.replace(/^(?:(?:\.\.\/)+)?images\//, '/images/');

    if (normalized.startsWith('/images/')) {
      const imagePath = path.join(root, 'images', normalized.slice('/images/'.length));
      if (!fs.existsSync(imagePath)) {
        console.warn(`Missing image asset, keeping alt text: ${normalized}`);
        return `**${alt}**`;
      }
    }

    return normalized === decoded ? match : `${open}${normalized}${close}`;
  });
}

function normalizeInternalLinks(body, routes) {
  function routeFor(target) {
    const decoded = decodeURIComponent(target).replaceAll('\\', '/');
    const clean = decoded.replace(/^\.\//, '').replace(/^\.\.\//, '');
    return routes.get(clean) ?? routes.get(path.basename(clean));
  }

  const replaceLink = (_, target) => {
    const route = routeFor(target);
    return route ? `](${route})` : `](${target})`;
  };

  return body
    .replace(/\]\(<([^>]+\.md)>\)/g, replaceLink)
    .replace(/\]\(([^)\s]+\.md)\)/g, replaceLink);
}

function normalizeMdxSyntax(body) {
  const lines = body.split(/\r?\n/);
  let inFence = false;

  return lines
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line.replace(/^(```|~~~)(?:flux|math)\s*$/u, '$1text');
      }

      if (inFence) return line;

      const inlineCode = [];
      const protectedLine = line
        .replace(/\\`/g, '`')
        .replace(/\\</g, '<')
        .replace(/(`+)([^`]*?)\1/g, (match) => {
        const token = `\u0000${inlineCode.length}\u0000`;
        inlineCode.push(match);
        return token;
      });

      const normalizedLine = protectedLine
        .replace(/<img\b([^>]*?)(?<!\/)\s*>/gi, (_, attributes) => `<img${attributes} />`)
        .replace(/<((?:https?|mailto):\/\/[^>]+)>/g, '[$1]($1)')
        .replace(/<([A-Za-z_][^>\n]*,[^>\n]*)>/g, '`<$1>`')
        .replace(/<([A-Za-z_][A-Za-z0-9_-]*\s*:[^>\n]*)>/g, '`<$1>`')
        .replace(/<(?=[-])/g, '&lt;')
        .replace(/<=/g, '&lt;=')
        .replace(/<(?=[A-Z]\b)/g, '&lt;')
        .replace(/\{([^{}\n]*:[^{}\n]+)\}/g, '`{$1}`')
        .replace(/\{([A-Za-z_][A-Za-z0-9_.-]*)\}/g, '`{$1}`');

      return normalizedLine.replace(/\u0000(\d+)\u0000/g, (_, index) => inlineCode[index]);
    })
    .join('\n');
}

function addFrontmatter(body, fallbackTitle) {
  if (/^---\s*\r?\n/.test(body)) return body;

  const metadata = metadataFor(body, fallbackTitle);
  return `---\ntitle: ${JSON.stringify(metadata.title)}\ndescription: ${JSON.stringify(metadata.description)}\n---\n\n${body.trim()}\n`;
}

function writeDocument(target, sourceBody, fallbackTitle, routes) {
  const body = normalizeMdxSyntax(
    normalizeInternalLinks(normalizeImageLinks(sourceBody), routes),
  );
  ensureDirectory(path.dirname(target));
  fs.writeFileSync(target, addFrontmatter(body, fallbackTitle));
}

function copyImages() {
  const sourceImages = path.join(root, 'images');
  fs.rmSync(publicImages, { recursive: true, force: true });
  if (fs.existsSync(sourceImages)) fs.cpSync(sourceImages, publicImages, { recursive: true });
}

function writeMeta(pairs) {
  const byVolume = new Map([
    ['volume-1', pairs.filter(({ info }) => info.volume === 'volume-1')],
    ['volume-2', pairs.filter(({ info }) => info.volume === 'volume-2')],
  ]);
  const rootPages = ['index'];

  for (const [volume, volumePairs] of byVolume) {
    if (volumePairs.length === 0) continue;
    rootPages.push(volume);
    const directory = path.join(contentRoot, volume);
    ensureDirectory(directory);
    fs.writeFileSync(
      path.join(directory, 'meta.json'),
      `${JSON.stringify(
        {
          title: volume === 'volume-1' ? 'Volume 1' : 'Volume 2',
          defaultOpen: true,
          pages: volumePairs.map(({ info }) => info.route.split('/').at(-1)),
        },
        null,
        2,
      )}\n`,
    );
  }

  fs.writeFileSync(
    path.join(contentRoot, 'meta.json'),
    `${JSON.stringify({ pages: rootPages }, null, 2)}\n`,
  );
}

function sync() {
  fs.rmSync(contentRoot, { recursive: true, force: true });
  ensureDirectory(contentRoot);
  copyImages();

  const pairs = sourceTargetPairs();
  const routes = new Map();
  for (const { relativePath, info } of pairs) {
    routes.set(relativePath, `/docs/${info.route}`);
    routes.set(path.basename(relativePath), `/docs/${info.route}`);
  }

  const readme = path.join(viRoot, 'README.md');
  if (fs.existsSync(readme)) {
    writeDocument(
      path.join(contentRoot, 'index.mdx'),
      fs.readFileSync(readme, 'utf8'),
      'System Design Interview',
      routes,
    );
  } else {
    fs.writeFileSync(
      path.join(contentRoot, 'index.mdx'),
      `---\ntitle: "System Design Interview"\ndescription: "Bản dịch tiếng Việt của System Design Interview: An Insider's Guide."\n---\n\n# System Design Interview\n\nBản dịch tiếng Việt đang được xây dựng. Các chương sẽ xuất hiện trên site ngay sau khi bản dịch tương ứng được thêm vào thư mục \`vi/\`.\n`,
    );
  }

  for (const { relativePath, info } of pairs) {
    const source = path.join(viRoot, relativePath);
    const filename = `${info.route.split('/').at(-1)}.mdx`;
    writeDocument(
      path.join(contentRoot, info.volume, filename),
      fs.readFileSync(source, 'utf8'),
      filename.replace(/\.mdx$/, ''),
      routes,
    );
  }

  writeMeta(pairs);
  console.log(`Synced ${pairs.length} Vietnamese chapter(s) into Fumadocs content.`);
}

sync();
