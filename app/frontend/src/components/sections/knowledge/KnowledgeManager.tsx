import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Agent } from '@/types/types';
import { useSecrets } from '@/hooks/useSecrets';
import { SERVER_URL } from '@/config';

const FILECOIN_REQUIRED_SECRETS = [
  'LIGHTHOUSE_API_KEY',
  'LIGHTHOUSE_PUBLIC_KEY',
  'LIGHTHOUSE_PRIVATE_KEY',
];

const availableKnowledgeProviders = [
  { name: 'Filecoin/Lighthouse', disabled: false },
];

interface KnowledgeFile {
  id: string;
  filename: string;
  created_at: string;
  url: string;
}

export default function KnowledgeManager({ agent }: { agent: Agent }) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({});
  const [savingSecret, setSavingSecret] = useState<string | null>(null);
  const [knowledge, setKnowledge] = useState('');
  const [savingKnowledge, setSavingKnowledge] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [viewedContent, setViewedContent] = useState<string | null>(null);
  const [viewedFilename, setViewedFilename] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);

  // Secrets hook
  const {
    loading: loadingSecrets,
    setSecret,
    hasSecretKey,
  } = useSecrets(agent?.id);

  // Provider status: all secrets present?
  const filecoinProviderEnabled = FILECOIN_REQUIRED_SECRETS.every((key) =>
    hasSecretKey(key),
  );

  // Fetch knowledge files
  const fetchKnowledgeFiles = async () => {
    if (!agent?.id) return;
    setLoadingFiles(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/storage?agentId=${agent.id}`);
      const data = await res.json();
      setKnowledgeFiles(data.files || []);
    } catch (err) {
      setKnowledgeFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeFiles();
  }, [agent?.id]);

  // Handle secret input change
  const handleSecretInput = (key: string, value: string) => {
    setSecretInputs((prev) => ({ ...prev, [key]: value }));
  };

  // Save or update a secret
  const saveSecretHandler = async (key: string) => {
    if (!agent?.id || !secretInputs[key]) return;
    setSavingSecret(key);
    try {
      await setSecret(key, secretInputs[key]);
      setSecretInputs((prev) => ({ ...prev, [key]: '' }));
    } catch (err) {
      // handle error
    } finally {
      setSavingSecret(null);
    }
  };

  // Save knowledge as a JSON file
  const saveKnowledge = async () => {
    if (!agent?.id || !knowledge.trim()) return;
    setSavingKnowledge(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/storage/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          filename: `knowledge-${Date.now()}.json`,
          content: { text: knowledge },
        }),
      });
      if (res.ok) {
        setSaveMessage('Knowledge saved successfully!');
        setKnowledge('');
        fetchKnowledgeFiles(); // Refresh list
      } else {
        setSaveMessage('Failed to save knowledge.');
      }
    } catch (err) {
      setSaveMessage('Error saving knowledge.');
    } finally {
      setSavingKnowledge(false);
    }
  };

  // View (decrypt) file
  const handleView = async (file: KnowledgeFile) => {
    if (!agent?.id) return;
    setViewing(true);
    setViewedFilename(file.filename);
    try {
      const res = await fetch(
        `${SERVER_URL}/api/storage/${file.id}?agentId=${agent.id}`,
      );
      if (!res.ok) throw new Error('Failed to fetch file');
      // Try to parse as text or JSON
      const contentType = res.headers.get('Content-Type') || '';
      let content: string;
      if (contentType.includes('application/json')) {
        const json = await res.json();
        content = JSON.stringify(json, null, 2);
      } else {
        content = await res.text();
      }
      setViewedContent(content);
    } catch (err) {
      setViewedContent('Failed to decrypt or fetch file.');
    } finally {
      setViewing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-2">Knowledge</h1>
      <p className="text-muted-foreground mb-6">
        Manage knowledge providers like Filecoin/Lighthouse.
      </p>

      {/* List of Uploaded Knowledge Files */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Uploaded Knowledge</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFiles ? (
            <div className="text-muted-foreground">Loading files...</div>
          ) : knowledgeFiles.length === 0 ? (
            <div className="text-muted-foreground">
              No knowledge files found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {knowledgeFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate">
                      {file.filename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Uploaded: {new Date(file.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(file)}
                    disabled={viewing}
                  >
                    {viewing && viewedFilename === file.filename
                      ? 'Loading...'
                      : 'View'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for viewing file content */}
      {viewedContent !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80">
          <div className="rounded-lg shadow-lg max-w-2xl w-full p-6 relative bg-background text-foreground">
            <h2 className="text-lg font-bold mb-2">{viewedFilename}</h2>
            <pre className="bg-muted p-4 rounded overflow-x-auto max-h-96 text-sm whitespace-pre-wrap">
              {viewedContent}
            </pre>
            <Button
              className="absolute top-2 right-2"
              size="sm"
              variant="outline"
              onClick={() => setViewedContent(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Available Providers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {availableKnowledgeProviders.map((provider) => (
              <Badge
                key={provider.name}
                variant="outline"
                className={`flex items-center gap-2 px-4 py-2 ${provider.disabled ? 'opacity-50' : ''}`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1 ${filecoinProviderEnabled ? 'bg-green-500' : 'bg-red-500'}`}
                />
                {provider.name}
                {!filecoinProviderEnabled &&
                  provider.name === 'Filecoin/Lighthouse' && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      Missing Secrets
                    </Badge>
                  )}
                <Button
                  size="sm"
                  variant="default"
                  className="ml-2"
                  disabled={provider.disabled}
                  onClick={() => setSelectedProvider(provider.name)}
                >
                  Settings
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Provider Settings Panel */}
      {selectedProvider === 'Filecoin/Lighthouse' && (
        <Card>
          <CardHeader>
            <CardTitle>Filecoin/Lighthouse Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
              {FILECOIN_REQUIRED_SECRETS.map((key) => (
                <div key={key} className="flex items-center gap-4">
                  <Badge variant={hasSecretKey(key) ? 'default' : 'secondary'}>
                    {key}
                  </Badge>
                  {hasSecretKey(key) ? (
                    <span className="text-green-600">Set</span>
                  ) : (
                    <span className="text-red-600">Missing</span>
                  )}
                  <Input
                    type="text"
                    placeholder={`Enter ${key}`}
                    value={secretInputs[key] ?? ''}
                    onChange={(e) => handleSecretInput(key, e.target.value)}
                    className="w-64"
                    disabled={loadingSecrets}
                  />
                  <Button
                    size="sm"
                    onClick={() => saveSecretHandler(key)}
                    disabled={
                      savingSecret === key ||
                      !secretInputs[key] ||
                      loadingSecrets
                    }
                  >
                    {savingSecret === key ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Enter knowledge text here..."
              value={knowledge}
              onChange={(e) => setKnowledge(e.target.value)}
              rows={8}
              className="mb-4"
              disabled={!filecoinProviderEnabled}
            />
            <Button
              onClick={saveKnowledge}
              disabled={
                !filecoinProviderEnabled || savingKnowledge || !knowledge.trim()
              }
            >
              {savingKnowledge ? 'Saving...' : 'Save Knowledge'}
            </Button>
            {saveMessage && (
              <div className="mt-2 text-sm text-muted-foreground">
                {saveMessage}
              </div>
            )}
            {!filecoinProviderEnabled && (
              <div className="mt-2 text-sm text-red-500">
                Please set all required secrets before saving knowledge.
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setSelectedProvider(null)}
              className="mt-6"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
