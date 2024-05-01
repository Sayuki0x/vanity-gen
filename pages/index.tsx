import type { NextPage } from "next";
import { Navbar } from "../components/Navbar";
import { useCallback, useEffect, useState } from "react";
import VanityWorker from "worker-loader!/workers/vanity.worker.js";

const Home: NextPage = () => {
    const [mounted, setMounted] = useState(false);
    const [threads, setThreads] = useState<number | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [mining, setMining] = useState(false);
    const [miningStats, setMiningStats] = useState({
        attempts: 0,
        speed: 0,
        firstTick: 0,
    });
    const [result, setResult] = useState<any | null>(null);
    const [prefix, setPrefix] = useState("");
    const [suffix, setSuffix] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const initWorkers = useCallback(() => {
        if (threads === null) {
            return;
        }
        if (workers.length === threads) {
            return;
        }

        const parseWorkerMessage = (message: any) => {
            const stop = async () => {
                setWorkers((currentWorkers) => {
                    currentWorkers.forEach((worker) => {
                        worker.terminate();
                    });
                    return [];
                });
                setMining(false);
                setMiningStats({ attempts: 0, speed: 0, firstTick: 0 });
            };

            if (message.attempts) {
                setMiningStats((prevState) => {
                    const now = performance.now();
                    const elapsedTime = now - prevState.firstTick; // Fallback to now if firstTick is not set
                    const newSpeed =
                        elapsedTime > 0
                            ? Math.floor(
                                  (1000 *
                                      (prevState.attempts + message.attempts)) /
                                      elapsedTime,
                              )
                            : 0;
                    return {
                        attempts: prevState.attempts + message.attempts,
                        speed: newSpeed,
                        firstTick: prevState.firstTick,
                    };
                });
            }

            if (message.error) {
                console.error(message.error);
                stop();
                return;
            }

            if (message.address) {
                setResult(message);
                stop();
                return;
            }
        };

        const newWorkers = [...workers];

        for (let i = newWorkers.length; i < threads; i++) {
            newWorkers[i] = new VanityWorker();
            newWorkers[i].onmessage = (event) => parseWorkerMessage(event.data);
        }

        setWorkers(newWorkers);
    }, [threads, workers]);

    useEffect(() => {
        try {
            setThreads(navigator.hardwareConcurrency);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const startGen = useCallback(() => {
        if (!window.Worker) {
            console.error("Web Workers not supported");
            return;
        }
        initWorkers();
        setResult(null);
        setMining(true);
        setMiningStats({ attempts: 0, speed: 0, firstTick: performance.now() });
        setWorkers((currentWorkers) => {
            currentWorkers.forEach((worker) => {
                worker.postMessage({
                    type: "startMining",
                    prefix,
                    suffix,
                    checksum: false,
                    threads,
                });
            });
            return currentWorkers;
        });
    }, [initWorkers, prefix, suffix, threads]);

    const stopGen = useCallback(() => {
        setWorkers((currentWorkers) => {
            currentWorkers.forEach((worker) => {
                worker.terminate();
            });
            return [];
        });
        setMining(false);
        setMiningStats({ attempts: 0, speed: 0, firstTick: 0 });
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div>
            <Navbar />
            <div className="w-full p-5 z-10">
                <>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm">Prefix</label>
                        <input
                            value={prefix}
                            onChange={(event) => {
                                setPrefix(event.target.value);
                            }}
                            className="bg-gray-200 px-3 py-2 rounded w-48"
                        ></input>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                        <label className="text-sm">Suffix</label>
                        <input
                            value={suffix}
                            onChange={(event) => {
                                setSuffix(event.target.value);
                            }}
                            className="bg-gray-200 px-3 py-2 rounded w-48"
                        ></input>
                    </div>
                    <pre>
                        <br />
                        CPU Threads: {threads}
                        <br />
                        Workers: {workers.length}
                        <br />
                        Speed: {miningStats.speed} addresses/second
                        <br />
                        Attempts: {miningStats.attempts}
                    </pre>

                    {result && (
                        <div>
                            <pre>
                                Address: {result.address}
                                <br />
                                Private Key: {result.privKey}
                            </pre>
                        </div>
                    )}

                    {!mining && (
                        <button
                            onClick={startGen}
                            className="bg-blue-600 px-3 py-2 text-white rounded font-bold mt-3"
                        >
                            Start mining
                        </button>
                    )}
                    {mining && (
                        <button
                            onClick={stopGen}
                            className="bg-blue-600 px-3 py-2 text-white rounded font-bold mt-3"
                        >
                            Stop mining
                        </button>
                    )}
                </>
            </div>
        </div>
    );
};

export default Home;
