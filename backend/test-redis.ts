import Redis, { Cluster } from "ioredis";

/**
 * Test script to verify Redis/ElastiCache connection
 *
 * Usage:
 *   npx ts-node test-redis.ts
 *
 * Or with environment variables:
 *   REDIS_HOST=127.0.0.1 REDIS_PORT=6379 npx ts-node test-redis.ts
 */

// Configuration from environment variables
const config = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === "true",
  clusterMode: process.env.REDIS_CLUSTER_MODE === "true",
};

console.log("🔧 Redis Connection Test");
console.log("========================");
console.log(`Host: ${config.host}`);
console.log(`Port: ${config.port}`);
console.log(`TLS: ${config.tls}`);
console.log(`Cluster Mode: ${config.clusterMode}`);
console.log(`Password: ${config.password ? "***" : "(none)"}`);
console.log("");

async function testConnection() {
  let client: Redis | Cluster;

  try {
    if (config.clusterMode) {
      // Cluster mode connection
      console.log("🔄 Connecting in cluster mode...");
      client = new Cluster(
        [{ host: config.host, port: config.port }],
        {
          redisOptions: {
            password: config.password,
            tls: config.tls ? { rejectUnauthorized: false } : undefined,
            connectTimeout: 10000,
          },
          clusterRetryStrategy: (times) => {
            if (times > 3) {
              console.error("❌ Cluster connection failed after 3 retries");
              return null;
            }
            return Math.min(times * 200, 2000);
          },
        }
      );
    } else {
      // Standalone mode connection
      console.log("🔄 Connecting in standalone mode...");
      client = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        tls: config.tls ? { rejectUnauthorized: false } : undefined,
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error("❌ Connection failed after 3 retries");
            return null;
          }
          return Math.min(times * 200, 2000);
        },
      });
    }

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      client.on("ready", () => {
        console.log("✅ Connected to Redis!");
        resolve();
      });

      client.on("error", (err) => {
        reject(err);
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        reject(new Error("Connection timeout after 15 seconds"));
      }, 15000);
    });

    // Test PING
    console.log("\n📡 Testing PING...");
    const pingResult = await client.ping();
    console.log(`✅ PING response: ${pingResult}`);

    // Test SET
    console.log("\n📝 Testing SET...");
    const testKey = `test:connection:${Date.now()}`;
    const testValue = "Hello from Node.js!";
    await client.set(testKey, testValue);
    console.log(`✅ SET ${testKey} = "${testValue}"`);

    // Test GET
    console.log("\n📖 Testing GET...");
    const getValue = await client.get(testKey);
    console.log(`✅ GET ${testKey} = "${getValue}"`);

    // Verify value matches
    if (getValue === testValue) {
      console.log("✅ Value matches!");
    } else {
      console.error("❌ Value mismatch!");
    }

    // Test DELETE
    console.log("\n🗑️  Testing DELETE...");
    await client.del(testKey);
    console.log(`✅ Deleted ${testKey}`);

    // Get server info
    console.log("\n📊 Server Info:");
    if (client instanceof Cluster) {
      const nodes = client.nodes("master");
      console.log(`   Cluster nodes: ${nodes.length}`);
    } else {
      const info = await client.info("server");
      const versionMatch = info.match(/redis_version:(.+)/);
      if (versionMatch) {
        console.log(`   Redis version: ${versionMatch[1].trim()}`);
      }
    }

    console.log("\n✅ All tests passed! Redis connection is working.\n");

    // Cleanup
    await client.quit();
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error(error);
    console.log("\n💡 Troubleshooting tips:");
    console.log("   1. If using AWS ElastiCache, make sure you're connected via SSH tunnel:");
    console.log("      ssh -i key.pem -L 6379:YOUR_ELASTICACHE_HOST:6379 ec2-user@EC2_IP -N");
    console.log("   2. Check that REDIS_HOST and REDIS_PORT are correct");
    console.log("   3. For ElastiCache with TLS, set REDIS_TLS=true");
    console.log("   4. For ElastiCache cluster mode, set REDIS_CLUSTER_MODE=true");
    console.log("   5. Make sure Redis is running and accessible\n");
    process.exit(1);
  }
}

testConnection();
