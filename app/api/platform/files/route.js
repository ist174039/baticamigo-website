import { randomUUID } from 'node:crypto';
import { context, collection, json, failure } from '../../../../lib/platform/server';
import { assert, id, manages, profileIds } from '../../../../lib/platform/domain.mjs';
import { canWriteRecord } from '../../../../lib/platform/modules.mjs';
import { validateUploadedFile } from '../../../../lib/platform/file-validation.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { db, account, storage } = await context(request);
    const length = Number(request.headers.get('content-length') || 0);
    assert(length > 0 && length <= 4_500_000, 'O ficheiro tem de ter menos de 4 MB.', 413);
    const data = await request.formData();
    const file = data.get('file');
    const kind = String(data.get('kind') || '');
    const studentId = id(String(data.get('studentId') || ''));
    assert(file && typeof file.arrayBuffer === 'function', 'Selecione um ficheiro.');
    assert(['assignment', 'material', 'document', 'justification'].includes(kind), 'Tipo de registo inválido.');
    assert(file.size > 0 && file.size <= 4_000_000, 'O ficheiro tem de ter menos de 4 MB.', 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = validateUploadedFile(bytes, file.type);

    const studentSnapshot = await collection(db, 'profiles').doc(studentId).get();
    assert(studentSnapshot.exists && studentSnapshot.data().kind === 'student', 'Aluno inexistente.', 404);
    let sessions = [];
    if (!manages(account)) {
      const sessionResults = await Promise.all(profileIds(account).map(profileId => collection(db, 'sessions').where('tutorId', '==', profileId).limit(200).get()));
      sessions = sessionResults.flatMap(snapshot => snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }
    assert(canWriteRecord(account, { kind, studentId }, { ...studentSnapshot.data(), id: studentId }, sessions), 'Sem permissão para partilhar ficheiros com este aluno.', 403);

    const key = randomUUID();
    const filePath = `platform-files/${account.uid}/${key}`;
    const originalName=String(file.name || `ficheiro${extension}`).replace(/[\\/\r\n\0]/g,' ').slice(0,180);
    await storage.file(filePath).save(bytes, {
      resumable: false,
      metadata: { contentType: file.type, metadata: { uploadedBy: account.uid, studentId, recordKind: kind, originalName } },
    });
    return json({ filePath, fileName: originalName }, 201);
  } catch (error) { return failure(error); }
}
