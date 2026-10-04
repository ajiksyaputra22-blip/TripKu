const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanBiodata() {
  console.log('🔄 Memulai pembersihan biodata di database...');

  // 1. Bersihkan Travel.description
  const travels = await prisma.travel.findMany();
  let travelUpdatedCount = 0;

  for (const t of travels) {
    let needsUpdate = false;
    let newDescription = t.description;
    let newSiup = t.siupUrl;

    if (t.description && t.description.includes('[IZIN_USAHA_URL]:')) {
      const parts = t.description.split('[IZIN_USAHA_URL]:');
      const url = parts[1]?.trim();
      if (!newSiup && url) {
        newSiup = url;
      }
      newDescription = t.description.replace(/\[IZIN_USAHA_URL\]:[^\s\n\r]+/gi, '').trim() || null;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.travel.update({
        where: { id: t.id },
        data: {
          description: newDescription,
          siupUrl: newSiup,
        },
      });
      travelUpdatedCount++;
      console.log(`✅ Travel "${t.businessName}" dibersihkan. SIUP: ${newSiup}`);
    }
  }

  // 2. Bersihkan WorkerProfile.bio
  const workers = await prisma.workerProfile.findMany({
    include: { user: true },
  });
  let workerUpdatedCount = 0;

  for (const w of workers) {
    let needsUpdate = false;
    let newBio = w.bio;
    let newSim = w.simImageUrl;
    let newCert = w.certificateUrl;

    if (w.bio && (w.bio.includes('[SIM_URL]:') || w.bio.includes('[CERTIFICATE_PDF_URL]:') || w.bio.includes('[IZIN_USAHA_URL]:'))) {
      if (w.bio.includes('[SIM_URL]:')) {
        const simPart = w.bio.split('[SIM_URL]:')[1]?.split('|')[0]?.trim();
        if (!newSim && simPart) {
          newSim = simPart;
        }
      }

      if (w.bio.includes('[CERTIFICATE_PDF_URL]:')) {
        const certPart = w.bio.split('[CERTIFICATE_PDF_URL]:')[1]?.split('|')[0]?.trim();
        if (!newCert && certPart) {
          newCert = certPart;
        }
      }

      newBio = w.bio
        .replace(/\[SIM_URL\]:[^\s\n\r|]+/gi, '')
        .replace(/\[CERTIFICATE_PDF_URL\]:[^\s\n\r|]+/gi, '')
        .replace(/\[IZIN_USAHA_URL\]:[^\s\n\r|]+/gi, '')
        .replace(/\|\s*\|/g, '|')
        .replace(/^\s*\|\s*/, '')
        .replace(/\s*\|\s*$/, '')
        .trim() || null;

      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.workerProfile.update({
        where: { id: w.id },
        data: {
          bio: newBio,
          simImageUrl: newSim,
          certificateUrl: newCert,
        },
      });
      workerUpdatedCount++;
      console.log(`✅ Worker "${w.user?.name || w.id}" (${w.workerType}) dibersihkan. SIM: ${newSim}, Cert: ${newCert}`);
    }
  }

  console.log(`\n🎉 Selesai! ${travelUpdatedCount} travel dan ${workerUpdatedCount} worker berhasil dibersihkan.`);
}

cleanBiodata()
  .catch((e) => {
    console.error('❌ Gagal membersihkan biodata:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
