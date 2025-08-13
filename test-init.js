const fetch = require('node-fetch');

async function initProjectAndTree() {
  const authority = '3KbAKcvoX91kBL59LUBxRq2chapuWhd1KfV86N5zxU5q'; // Replace with your Solana wallet public key
  try {
    const projectRes = await fetch('http://localhost:3000/api/create-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authority }),
    });
    const projectData = await projectRes.json();
    if (projectData.error) throw new Error(projectData.error);
    console.log('Project created:', projectData.project);

    const treeRes = await fetch('http://localhost:3000/api/create-profiles-tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payer: authority, project: projectData.project }),
    });
    const treeData = await treeRes.json();
    if (treeData.error) throw new Error(treeData.error);
    console.log('Profiles tree created');
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

initProjectAndTree();