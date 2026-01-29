import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import healthRoute from '../health';

// Mock the infrastructure getDB function
vi.mock('@repo/infrastructure', () => ({
  getDB: vi.fn(),
}));

describe.skip('Health Route', () => {
  let app: Hono;
  let mockDB: any;

  beforeEach(() => {
    const { getDB } = require('@repo/infrastructure');
    
    mockDB = {
      admin: vi.fn().mockReturnValue({
        ping: vi.fn().mockResolvedValue({}),
      }),
    };
    
    vi.mocked(getDB).mockReturnValue(mockDB);

    app = new Hono();
    app.route('/health', healthRoute);
  });

  describe('GET /health', () => {
    it('should return healthy status when MongoDB is connected', async () => {
      const res = await app.request('/health');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toMatchObject({
        status: 'healthy',
        services: {
          mongodb: 'connected',
          api: 'running',
        },
      });
      expect(json.timestamp).toBeDefined();
    });

    it('should include ISO timestamp', async () => {
      const res = await app.request('/health');
      const json = await res.json();

      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should call MongoDB ping', async () => {
      await app.request('/health');

      expect(mockDB.admin).toHaveBeenCalled();
      expect(mockDB.admin().ping).toHaveBeenCalled();
    });

    it('should return unhealthy status when MongoDB ping fails', async () => {
      mockDB.admin().ping.mockRejectedValueOnce(new Error('Connection timeout'));

      const res = await app.request('/health');
      const json = await res.json();

      expect(res.status).toBe(503);
      expect(json).toMatchObject({
        status: 'unhealthy',
        error: 'Connection timeout',
      });
    });

    it('should return unhealthy status when getDB throws', async () => {
      const { getDB } = require('@repo/infrastructure');
      vi.mocked(getDB).mockImplementationOnce(() => {
        throw new Error('Database not initialized');
      });

      const res = await app.request('/health');
      const json = await res.json();

      expect(res.status).toBe(503);
      expect(json.status).toBe('unhealthy');
      expect(json.error).toBe('Database not initialized');
    });

    it('should handle unknown errors gracefully', async () => {
      mockDB.admin().ping.mockRejectedValueOnce('Unknown error');

      const res = await app.request('/health');
      const json = await res.json();

      expect(res.status).toBe(503);
      expect(json.status).toBe('unhealthy');
      expect(json.error).toBe('Unknown error');
    });

    it('should always include timestamp even on error', async () => {
      mockDB.admin().ping.mockRejectedValueOnce(new Error('Failed'));

      const res = await app.request('/health');
      const json = await res.json();

      expect(json.timestamp).toBeDefined();
      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple concurrent health checks', async () => {
      const requests = Array(10).fill(null).map(() => app.request('/health'));
      const responses = await Promise.all(requests);

      responses.forEach(res => {
        expect(res.status).toBe(200);
      });

      expect(mockDB.admin().ping).toHaveBeenCalledTimes(10);
    });

    it('should handle slow MongoDB ping', async () => {
      mockDB.admin().ping.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const res = await app.request('/health');
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.status).toBe('healthy');
    });
  });
});



