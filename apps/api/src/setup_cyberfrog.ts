import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { spawn } from "child_process";
import { logger } from "@frogcrypto/shared";

/**
 * pnpm run setup-cyberfrog will set up a Cyberfrog device for FrogCrypto.
 * This script flashes the ESP32 with firmware and bootloader, then sets up the feed.
 * It requires the following files to be present in the "firmware" folder:
 *   - cyberfrog.bin
 *   - bootloader.bin
 *   - partition-table.bin
 **/

// Configuration
const FIRMWARE_PATH = "./firmware/cyberfrog.bin";
const BOOTLOADER_PATH = "./firmware/bootloader.bin";
const PARTITION_TABLE_PATH = "./firmware/partition-table.bin";

interface PortInfo {
  path: string;
  manufacturer: string | undefined;
  locationId: string | undefined;
  vendorId: string | undefined;
  productId: string | undefined;
}

async function findESP32Port(): Promise<string> {
  const ports: PortInfo[] = await SerialPort.list();
  const esp32Port = ports.find((port: PortInfo) =>
    port.manufacturer?.toLowerCase().includes("espressif"),
  );

  if (!esp32Port) {
    throw new Error("No ESP32 device found. Please check the connection.");
  }

  return esp32Port.path;
}

function flashFirmware(port: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "--chip",
      "esp32c3",
      "-p",
      port,
      "-b",
      "460800",
      "--before=default_reset",
      "--after=hard_reset",
      "write_flash",
      "--flash_mode",
      "dio",
      "--flash_freq",
      "80m",
      "--flash_size",
      "2MB",
      "0x0",
      BOOTLOADER_PATH,
      "0x10000",
      FIRMWARE_PATH,
      "0x8000",
      PARTITION_TABLE_PATH,
    ];

    const esptool = spawn("esptool.py", args, { env: process.env });

    esptool.stdout.on("data", (data: string) => {
      console.log(data);
    });

    esptool.stderr.on("data", (data: string) => {
      console.error(data);
    });

    esptool.on("close", (code: number) => {
      if (code !== 0) {
        console.error(`esptool.py process exited with code ${code.toString()}`);
        reject(
          new Error(`esptool.py process exited with code ${code.toString()}`),
        );
      } else {
        console.info("Flashing complete.");
        resolve();
      }
    });
  });
}

async function readPublicKey(portName: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const port = new SerialPort({ path: portName, baudRate: 115200 });
    const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
    console.log(`Listening for public key on ${portName}...`);

    parser.on("data", (line: string) => {
      line = line.trim();
      if (line.includes("Public key")) {
        port.close();
        const parsedKey = line.trim().split(" ")[2];
        if (parsedKey) {
          resolve(parsedKey);
        } else {
          reject(new Error("Couldn't parse public key"));
        }
      }
    });

    port.on("error", (err: Error) => {
      port.close();
      reject(err);
    });
  });
}

async function main() {
  try {
    const portName = await findESP32Port();
    logger.info(`ESP32 device found on port: ${portName}`);

    await flashFirmware(portName);

    const publicKey = await readPublicKey(portName);

    // now we can do whatever we want with the pubkey:
    console.log("Public key captured successfully:");
    console.log(publicKey);
    // setupCyberFeed(publicKey)
  } catch (error) {
    console.error(`An error occurred: ${(error as Error).message}`);
  }
}

main();
