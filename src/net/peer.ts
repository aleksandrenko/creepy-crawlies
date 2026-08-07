/**
 * A direct browser-to-browser link, with no server of ours involved.
 *
 * WebRTC still needs the two peers to exchange one blob of connection details each. With
 * no signalling server, the players do that themselves: the host produces an invite code,
 * sends it over any chat app, and pastes back the answer code they get in return.
 *
 * Known limits, by design rather than oversight:
 *  - Public STUN only. Most home networks connect; symmetric NAT (often mobile data,
 *    sometimes corporate wifi) needs a TURN relay, which would be a server. Those
 *    connections simply fail, and `onFailed` reports it.
 *  - Codes are large because they carry every gathered ICE candidate. They are deflated
 *    and base64url'd, which gets them to roughly a kilobyte of text.
 */

const STUN: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

const PREFIX = 'CC1';
const LABEL = 'creepy-crawlies';

export type PeerRole = 'host' | 'guest';

export interface PeerEvents {
  onOpen?: () => void;
  onMessage?: (data: unknown) => void;
  onClosed?: (reason: string) => void;
  onFailed?: (reason: string) => void;
}

// ── code encoding ─────────────────────────────────────────────────────────────

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function squeeze(text: string): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') return new TextEncoder().encode(text);
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unsqueeze(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined') return new TextDecoder().decode(bytes);
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

async function encodeCode(role: PeerRole, description: RTCSessionDescriptionInit): Promise<string> {
  const payload = JSON.stringify({ t: description.type, s: description.sdp });
  const body = toBase64Url(await squeeze(payload));
  // Grouped for legibility when someone reads a code out or pastes it by hand.
  return `${PREFIX}-${role === 'host' ? 'O' : 'A'}-${body}`;
}

async function decodeCode(code: string): Promise<{ role: PeerRole; description: RTCSessionDescriptionInit }> {
  const cleaned = code.trim().replace(/\s+/g, '');
  const match = /^CC1-([OA])-(.+)$/.exec(cleaned);
  if (!match) throw new Error('That does not look like a Creepy Crawlies code.');
  const json = await unsqueeze(fromBase64Url(match[2]!));
  const parsed = JSON.parse(json) as { t: RTCSdpType; s: string };
  return {
    role: match[1] === 'O' ? 'host' : 'guest',
    description: { type: parsed.t, sdp: parsed.s },
  };
}

/** Tells the two halves of the flow apart before we try to use a code. */
export async function codeRole(code: string): Promise<PeerRole> {
  return (await decodeCode(code)).role;
}

// ── the link ──────────────────────────────────────────────────────────────────

export class PeerLink {
  private readonly pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  private closed = false;

  constructor(private readonly events: PeerEvents) {
    this.pc = new RTCPeerConnection({ iceServers: STUN });

    this.pc.addEventListener('connectionstatechange', () => {
      const s = this.pc.connectionState;
      if (s === 'failed') this.fail('Could not reach the other player. One of you is probably behind a network that blocks direct connections.');
      else if (s === 'disconnected' || s === 'closed') this.shut('The connection dropped.');
    });

    // The guest never creates the channel; it arrives with the offer.
    this.pc.addEventListener('datachannel', (e) => this.bind(e.channel));
  }

  private bind(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.addEventListener('open', () => this.events.onOpen?.());
    channel.addEventListener('close', () => this.shut('The other player left.'));
    channel.addEventListener('message', (e) => {
      try {
        this.events.onMessage?.(JSON.parse(String(e.data)));
      } catch {
        // A peer sending us garbage is not worth tearing the battle down for.
      }
    });
  }

  /**
   * Waits for ICE gathering to finish so the whole connection fits in one code.
   * Trickle ICE would need a live channel between the peers, which is the thing we do
   * not have. Capped, because some networks never report completion.
   */
  private gathered(): Promise<void> {
    if (this.pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      };
      const check = () => {
        if (this.pc.iceGatheringState === 'complete') done();
      };
      const timer = setTimeout(done, 4000);
      this.pc.addEventListener('icegatheringstatechange', check);
    });
  }

  /** Host step 1: produce the code to send to the other player. */
  async createInvite(): Promise<string> {
    this.bind(this.pc.createDataChannel(LABEL, { ordered: true }));
    await this.pc.setLocalDescription(await this.pc.createOffer());
    await this.gathered();
    if (!this.pc.localDescription) throw new Error('Could not prepare an invite.');
    return encodeCode('host', this.pc.localDescription);
  }

  /** Guest: take the host's code and produce the answer code to send back. */
  async acceptInvite(code: string): Promise<string> {
    const { role, description } = await decodeCode(code);
    if (role !== 'host') throw new Error('That is an answer code, not an invite code.');
    await this.pc.setRemoteDescription(description);
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    await this.gathered();
    if (!this.pc.localDescription) throw new Error('Could not prepare an answer.');
    return encodeCode('guest', this.pc.localDescription);
  }

  /** Host step 2: paste the answer code back in, and the link comes up. */
  async completeInvite(code: string): Promise<void> {
    const { role, description } = await decodeCode(code);
    if (role !== 'guest') throw new Error('That is an invite code, not an answer code.');
    await this.pc.setRemoteDescription(description);
  }

  get ready(): boolean {
    return this.channel?.readyState === 'open';
  }

  send(message: unknown): void {
    if (this.channel?.readyState !== 'open') return;
    this.channel.send(JSON.stringify(message));
  }

  private fail(reason: string): void {
    if (this.closed) return;
    this.closed = true;
    this.events.onFailed?.(reason);
  }

  private shut(reason: string): void {
    if (this.closed) return;
    this.closed = true;
    this.events.onClosed?.(reason);
  }

  close(): void {
    this.closed = true;
    try {
      this.channel?.close();
      this.pc.close();
    } catch {
      // Already gone.
    }
  }
}
