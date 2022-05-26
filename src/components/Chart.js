import { createChart, CrosshairMode } from 'lightweight-charts';
import React, { useState, useEffect, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import axios from 'axios';
import Select from 'react-select';

const initData = [];
const chartOptions = {
    width: 600,
    height: 300,
    layout: {
        textColor: 'black',
        backgroundColor: "#131722",
        background: {
            type: 'solid', color: 'white'
        }
    },
    crosshair: {
        mode: CrosshairMode.Normal
    },
    priceScale: {
        scaleMargins: {
            top: 0.3,
            bottom: 0.25
        },
        borderVisible: false
    },
    grid: {
        vertLines: {
            color: "rgba(42, 46, 57, 0)"
        },
        horzLines: {
            color: "rgba(42, 46, 57, 0.6)"
        }
    }
};
const options = [
    { value: 'btcusdt', label: 'btcusdt' }
]

var rendered = false;

export default function Chart(props) {

    const [data, setData] = useState([]);

    // axios.get('https://api.binance.com/api/v3/exchangeInfo')
    // .then(function (response) {
    //   // console.log(response);
    //   setData(response.data.symbols.map(item => {
    //     return { value: item.symbol, label: item.symbol };
    //   }));
    // })
    // .catch(function (error) {
    //   console.log(error);
    // });


    const WSS_URL = "wss://stream.binance.com:9443/ws/btcusdt@kline_1m";
    const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WSS_URL);
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    const [candleSeries, setCandleSeries] = useState(null);
    const [hold, setHold] = useState(0);

    useEffect(() => {
        if (!rendered) {
            init();
            rendered = true;
        }
        if (lastJsonMessage !== null) {
            if (!lastJsonMessage.result && lastJsonMessage !== null && !lastJsonMessage.id) {
                if (candleSeries && candleSeries != null) {
                    // update at each minute
                    if (lastJsonMessage.E - hold > 60000) {
                        setHold(lastJsonMessage.E);
                    }
                    candleSeries.update({ time: hold, open: lastJsonMessage.k.o, close: lastJsonMessage.k.c, high: lastJsonMessage.k.h, low: lastJsonMessage.k.l });
                }
            }
        }
    });


    const init = useCallback(() => {
        const chart = createChart(document.getElementById("chart_candleSticks"), chartOptions);
        const candlestickSeries = chart.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
        candlestickSeries.setData(initData);
        setCandleSeries(candlestickSeries);
        chart.timeScale().fitContent();
    }, []);

    function changeStream(value, actionType) {
        sendJsonMessage({
            "method": "UNSUBSCRIBE",
            "params":
                [
                    "btcusdt@kline_1m"
                ],
            "id": 1
        });
        
        sendJsonMessage({
            "method": "SUBSCRIBE",
            "params":
                [
                    "btcusdt@kline_1m"
                ],
            "id": 1
        })
    }

    return (
        <>
            <Select options={options} onChange={changeStream} />
            <div id='chart_candleSticks' />
            <select onChange={null}>
                <option value={'opt1'}>Opt1</option>
                <option value={'opt2'}>Opt2</option>
                <option value={'opt3'}>Opt3</option>
            </select>
            {/* <button onClick={() => sendJsonMessage({
                "method": "SUBSCRIBE",
                "params":
                    [
                        "btcusdt@kline_1m"
                    ],
                "id": 1
            })}>Start</button>
            <button onClick={() => sendJsonMessage({
                "method": "UNSUBSCRIBE",
                "params":
                    [
                        "btcusdt@kline_1m"
                    ],
                "id": 1
            })}>Stop</button> */}
        </>

    );
}