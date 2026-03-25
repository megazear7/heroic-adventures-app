import dotenv from 'dotenv';
dotenv.config();

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const entryId = '6yf1JLUwxQ3qRgaVShr1sD';

async function main() {
  // GET the entry
  const getRes = await fetch(`https://api.contentful.com/spaces/${spaceId}/environments/master/entries/${entryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const entry = await getRes.json();
  const version = entry.sys.version;
  console.log('Current version:', version);
  console.log('Current title:', entry.fields.title['en-US']);

  // Update the title
  entry.fields.title['en-US'] = 'Swift (Elf)';

  const updateRes = await fetch(`https://api.contentful.com/spaces/${spaceId}/environments/master/entries/${entryId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Contentful-Version': version,
    },
    body: JSON.stringify({ fields: entry.fields }),
  });
  const updated = await updateRes.json();
  console.log('Updated version:', updated.sys.version);
  console.log('Updated title:', updated.fields.title['en-US']);

  // Publish
  const pubRes = await fetch(`https://api.contentful.com/spaces/${spaceId}/environments/master/entries/${entryId}/published`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Contentful-Version': updated.sys.version,
    },
  });
  const published = await pubRes.json();
  if (published.sys.publishedVersion) {
    console.log('Published successfully! Version:', published.sys.publishedVersion);
  } else {
    console.log('Publish response:', JSON.stringify(published, null, 2));
  }
}

main().catch(console.error);
