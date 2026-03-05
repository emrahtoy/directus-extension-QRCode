// extensions/endpoints/qr-code/index.js (ou équivalent)
import qr from 'qr-image'; // CommonJS sous le capot, mais fonctionne avec import default

export default {
	id: 'qr-code',
	handler: async ({ link, folder }, { services, getSchema, accountability, logger }) => {
		try {
			if (!link) throw new Error('Paramètre "link" manquant');

			// Génère un flux PNG depuis la lib (pas d’appel réseau)
			// size = taille d’un "module" en pixels (pas la taille finale exacte)
			const qrStream = qr.image(String(link), {
				type: 'png',
				ec_level: 'H', // même niveau de correction d’erreur que ton API (élevé)
				size: 8,       // ajuste au besoin (voir note ci-dessous)
				margin: 2,     // marge blanche autour
			});

			const safeName = String(link).replace(/[^\w-]/g, '_').slice(0, 200);

			const { FilesService } = services;
			const schema = await getSchema();
			const filesService = new FilesService({ schema, accountability });

			// FilesService.uploadOne accepte un Readable stream → on lui passe directement qrStream
			const fileId = await filesService.uploadOne(qrStream, {
				storage: 'local',
				filename_download: `qrcode_${safeName}.png`,
				title: `QR Code - ${link}`,
				type: 'image/png',
				folder: folder || null
			});

			return fileId;
		} catch (error) {
			logger?.error?.('QR Code generation failed:', error);
			throw error;
		}
	},
};

