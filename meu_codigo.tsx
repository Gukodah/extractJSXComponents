import { useContext, useRef, useEffect } from "react";
import { ReportsContext } from "../../contexts/ReportsContext/ReportsContextProvider";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { GlobalContext } from "../../contexts/GlobalContext/GlobalContextProvider";
import { InputDateTimeRange } from "../../components/InputDateTimeRange/InputDateTimeRange";
import { useIsInViewport } from "../../hooks/useIsInViewPort";
import { Images } from "../../assets/images";
import { Theme, Typography, createStyles, withStyles, makeStyles, Button, FormControlLabel, Checkbox } from "@material-ui/core";
import { socket } from "../../socket";
import { MultiSelect } from "../../components/MultiSelect/MultiSelect";
import Select from "react-select";
import Plot from 'react-plotly.js';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { useEffectExludingFirstRender } from "../../hooks/useEffectExcludingFirstRender";
import moment from "moment";

const GeneralReportView = () => {

    const datePeriodOptions = [{ value: "last_day", label: "Último dia" }, { value: "last_week", label: "Última semana" }, { value: "last_month", label: "Último mês" }, { value: "last_year", label: "Último ano" }];

    const { loading, availableDevices, selectedDevices, reportSheets, datePeriod, totalPowerConsumeTableRows, energyGraphData, enableIndividualDevicesGraphs } = useContext<any>(ReportsContext).generalReport;
    const { place, windowSize } = useContext(GlobalContext).ui;
    const kwhTableLeftLimit = useRef(0);
    const kwhTableRightLimit = useRef(20);
    const individualDevicesGraphsRightLimit = useRef(0);
    const individualDevicesGraphsLeftLimit = useRef(1);

    place.set("Relatório Geral");

    const coliderRef = useRef(null);
    const totalActivePower = useRef(0);
    const totalActivePowerCost = useRef(0);
    const totalReactivePower = useRef(0);
    const totalSeemingPower = useRef(0);

    const isInViewportControl = useIsInViewport(coliderRef);

    useEffect(() => {
        socket.emit("GetAllDevices");
        socket.on("GetAllDevicesSuccess", (data) => {
            availableDevices.set(data);
        });

        socket.on("GetGeneralReportDataForAssetSuccess", (data) => {
            totalPowerConsumeTableRows.set((previousTotalPowerConsumeTableRows) => {
                return [...previousTotalPowerConsumeTableRows.filter(e => e.assetName != data.assetName), data];
            });

            totalActivePower.current += data.totalActivePower.ammount;
            totalReactivePower.current += data.totalReactivePower;
            totalSeemingPower.current += data.totalSeemingPower;
            totalActivePowerCost.current += data.totalActivePower.cost;

            const newReportSheet = {

            };

            reportSheets.set((previousReportSheets) => {
                return [...previousReportSheets, newReportSheet]
            });
        });

        socket.on("GetGeneralReportGraphDataSuccess", (data) => {
            energyGraphData.set(data)
        });
    }, []);

    useEffectExludingFirstRender(() => {
        totalPowerConsumeTableRows.set((prev) => {
            return [...prev.filter((e) => selectedDevices.get.map(f => f.value).includes(e.assetName))]
        });

    }, [selectedDevices.get])

    const generateReportForEachDevice = (devicesToBeReported) => {
        kwhTableRightLimit.current = 20;
        kwhTableLeftLimit.current = 0;

        individualDevicesGraphsRightLimit.current = 1;
        individualDevicesGraphsLeftLimit.current = 0;

        totalActivePower.current = 0;
        totalActivePowerCost.current = 0;
        totalReactivePower.current = 0;
        totalSeemingPower.current = 0;

        socket.emit("GetGeneralReportGraphData", { deviceList: devicesToBeReported.map(e => { return { assetName: e.value } }), datePeriod: datePeriod.get })

        for (const device of devicesToBeReported) {
            socket.emit("GetGeneralReportDataForAsset", { asset: device.value, datePeriod: datePeriod.get });
        }
    }

    const StyledTableCell = withStyles((theme: Theme) =>
        createStyles({
            head: {
                backgroundColor: "#244e74",
                color: theme.palette.common.white,
            },
            body: {
                fontSize: 14,
                padding: 6.11
            },
        }),
    )(TableCell);

    const StyledTableRow = withStyles((theme: Theme) =>
        createStyles({
            root: {
                '&:nth-of-type(odd)': {
                    backgroundColor: "#d8d7d7",
                },
            },
        }),
    )(TableRow);

    const useStyles = makeStyles({
        table: {
            minWidth: 700,
        },
    });

    const classes = useStyles();

    const getDatePeriodFromDateSelection = () => {
        const currentDate = moment();

        switch (datePeriod.get) {
            case "last_day":
                return { start: currentDate.subtract(1, "day").set("h", 0).set("minute", 0).set("seconds", 0).format("DD/MM/YYYY"), end: currentDate.set("h", 23).set("minute", 59).set("seconds", 59).format("DD/MM/YYYY") };
            case "last_week":
                return { start: currentDate.startOf('week').subtract(1, "day").startOf("week").set("h", 0).set("minute", 0).set("seconds", 0).format("DD/MM/YYYY"), end: currentDate.endOf("week").set("h", 23).set("minute", 59).set("seconds", 59).format("DD/MM/YYYY") };
            case "last_month":
                return { start: currentDate.startOf('month').subtract(1, "day").startOf("month").set("h", 0).set("minute", 0).set("seconds", 0).format("DD/MM/YYYY"), end: currentDate.endOf("month").set("h", 23).set("minute", 59).set("seconds", 59).format("DD/MM/YYYY") };
            case "last_year":
                return { start: currentDate.startOf('year').subtract(1, "day").startOf("year").set("h", 0).set("minute", 0).set("seconds", 0).format("DD/MM/YYYY"), end: currentDate.endOf("year").set("h", 23).set("minute", 59).set("seconds", 59).format("DD/MM/YYYY") };
        }
    }

    return (
        <div style={{ flexGrow: 1 }}>
            <div ref={coliderRef}></div>
            {
                coliderRef.current && !isInViewportControl &&
                <div id="general-report-toolbox" style={{ height: windowSize.height * 0.898, width: windowSize.width * 0.229, position: "fixed", top: 80 }}>
                    <Paper style={{ height: "100%", flexDirection: "column", display: "flex", padding: 40 }}>
                        <Select
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary: '#00BFA5',
                                },
                            })}
                            options={datePeriodOptions}
                            onChange={(e) => datePeriod.set(e!.value)}
                            placeholder="Selecione um perido de tempo"
                        />

                        <MultiSelect
                            styles={{
                                container: (baseStyles, state) => ({
                                    ...baseStyles,
                                    marginTop: 16
                                })
                            }}
                            isLoading={availableDevices.get.length == 0}
                            options={availableDevices.get.map((device) => { return { value: device.mqttTopic, label: device.name }; })}
                            placeholder="Selecione as máquinas"
                            defaultValue={selectedDevices.get}
                            onChange={(selectedOptions) => {
                                selectedDevices.set(selectedOptions);
                            }}
                        />

                        <FormControlLabel
                            style={{ marginTop: 16 }}
                            control={(
                                <Checkbox
                                    checked={enableIndividualDevicesGraphs.get}
                                    onChange={(e) => { enableIndividualDevicesGraphs.set(e.target.checked) }}
                                    value="enableIndividualDevicesGraphs"
                                    classes={{
                                        root: `{
                                            color: "",
                                            '&$checked': {
                                                color: "#00BFA5",
                                            }`
                                    }}
                                />
                            )}
                            label="Incluir gráficos individuais para cada máquina"
                        />

                        <Button onClick={() => generateReportForEachDevice(selectedDevices.get)} style={{ marginTop: "12%" }} variant="contained">Gerar</Button>
                    </Paper>
                </div>
            }
            <Grid container spacing={2} style={{ marginTop: 24 }}>
                <Grid id="general-report-toolbox" item xs={6} sm={3} style={{ height: windowSize.height * 0.8 }}>
                    {
                        coliderRef.current && isInViewportControl &&
                        <Paper style={{ height: "100%", flexDirection: "column", display: "flex", padding: 40 }}>
                            <Select
                                theme={(theme) => ({
                                    ...theme,
                                    colors: {
                                        ...theme.colors,
                                        primary: '#00BFA5',
                                    },
                                })}
                                options={datePeriodOptions}
                                onChange={(e) => datePeriod.set(e!.value)}
                                placeholder="Selecione um perido de tempo"
                            />

                            <MultiSelect
                                styles={{
                                    container: (baseStyles, state) => ({
                                        ...baseStyles,
                                        marginTop: 16
                                    })
                                }}
                                isLoading={availableDevices.get.length == 0}
                                options={availableDevices.get.map((device) => { return { value: device.mqttTopic, label: device.name }; })}
                                placeholder="Selecione as máquinas"
                                onChange={(selectedOptions) => { selectedDevices.set(selectedOptions); generateReportForEachDevice(selectedOptions); }}
                                defaultValue={selectedDevices.get}
                            />

                            <FormControlLabel
                                style={{ marginTop: 16 }}
                                control={(
                                    <Checkbox
                                        checked={enableIndividualDevicesGraphs.get}
                                        onChange={(e) => { enableIndividualDevicesGraphs.set(e.target.checked) }}
                                        value="enableIndividualDevicesGraphs"
                                        classes={{
                                            root: `{
                                            color: "",
                                            '&$checked': {
                                                color: "#00BFA5",
                                            }`
                                        }}
                                    />
                                )}
                                label="Incluir gráficos individuais para cada máquina"
                            />
                            <Button onClick={() => generateReportForEachDevice(selectedDevices.get)} style={{ marginTop: 16 }} variant="contained">Gerar</Button>
                        </Paper>
                    }

                </Grid>
                <Grid id="general-report-preview" item xs={9} sm={9}>
                    <Paper style={{ paddingTop: 64, paddingBottom: 64 }}>
                        <div
                            style={{
                                background: "white",
                                width: "21cm",
                                height: "29.7cm",
                                display: "block",
                                margin: "0 auto",
                                marginBottom: "0.4cm",
                                boxShadow: "0 0 0.4cm rgba(0,0,0,0.5)"
                            }}
                        >
                            <img style={{ marginLeft: 32, marginTop: 32 }} src={Images.LogoEscritaEfd} />
                            <Typography style={{ marginLeft: 32, marginTop: "50%", textTransform: "uppercase", fontWeight: "bold" }} variant="h5">Relatório geral do consumo de energia</Typography>
                            <Typography style={{ marginLeft: 32, marginTop: "1%", textTransform: "uppercase", }} variant="h6">
                                {`${getDatePeriodFromDateSelection()?.start ?
                                    getDatePeriodFromDateSelection()?.start : "--/--/----"} 
                                    à 
                                    ${getDatePeriodFromDateSelection()?.end ? getDatePeriodFromDateSelection()?.end : "--/--/----"} `}
                            </Typography>
                        </div>
                        {/* Inicio tabela de consumo com todos os ativos */}

                        <div
                            style={{
                                background: "white",
                                width: "21cm",
                                height: "29.7cm",
                                display: "block",
                                margin: "0 auto",
                                marginBottom: "0.4cm",
                                boxShadow: "0 0 0.4cm rgba(0,0,0,0.5)",
                                padding: 22
                            }}
                        >
                            <b style={{ fontSize: 20 }}>1. Detalhes do projeto</b>

                            <div style={{ display: "flex" }}></div>

                            <div style={{ display: "flex", marginTop: 24, width: "100%", fontSize: 16, }}>
                                <div style={{ display: "flex", flexDirection: "column", width: "30%" }}>
                                    <div style={{ borderWidth: 1, borderColor: "black", borderRightWidth: 0, borderStyle: "solid", padding: 10 }} >Nome do projeto</div>
                                    <div style={{ borderWidth: 1, borderTopWidth: 0, borderRightWidth: 0, borderColor: "black", borderStyle: "solid", padding: 10 }} >Endereço</div>
                                    <div style={{ borderWidth: 1, borderTopWidth: 0, borderRightWidth: 0, borderColor: "black", borderStyle: "solid", padding: 10 }}>Número de módulos</div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", width: "70%" }}>
                                    <div style={{ borderWidth: 1, borderColor: "black", borderStyle: "solid", padding: 10 }}>Embalagens Flexíveis Diadema</div>
                                    <div style={{ borderWidth: 1, borderTopWidth: 0, borderColor: "black", borderStyle: "solid", padding: 10 }}>Av Fundibem 184 Diadema</div>
                                    <div style={{ borderWidth: 1, borderTopWidth: 0, borderColor: "black", borderStyle: "solid", padding: 10 }}>21</div>
                                </div>
                            </div>
                            <div style={{ height: 48 }}></div>
                            <b style={{ fontSize: 20 }}>2. Estatísticas de consumo</b>

                            <TableContainer component={'div'}>
                                <Table style={{ marginTop: 0 }} className={classes.table} aria-label="customized table">
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell align="center">Tipo</StyledTableCell>
                                            <StyledTableCell align="center">Mesmo periodo anterior</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <StyledTableRow>
                                            <StyledTableCell align="center">
                                                Consumo de energia | {totalActivePower.current.toFixed(2)} kW/h
                                            </StyledTableCell>
                                            <StyledTableCell align="center">0%</StyledTableCell>
                                        </StyledTableRow>

                                        <StyledTableRow>
                                            <StyledTableCell align="center">
                                                Consumo de gás | 0.00 t
                                            </StyledTableCell>
                                            <StyledTableCell align="center">0%</StyledTableCell>
                                        </StyledTableRow>

                                        <StyledTableRow>
                                            <StyledTableCell align="center">
                                                Consumo de água | 0.00 t
                                            </StyledTableCell>
                                            <StyledTableCell align="center">0%</StyledTableCell>
                                        </StyledTableRow>

                                        <StyledTableRow>
                                            <StyledTableCell align="center">
                                                Emissão de carbono | 0.00 kg
                                            </StyledTableCell>
                                            <StyledTableCell align="center">0%</StyledTableCell>
                                        </StyledTableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                        </div>
                        {
                            Array(Math.ceil(totalPowerConsumeTableRows.get.length / 20)).fill(0)
                                .map((e, pageIndex, pages) => {

                                    if (pageIndex == 0) {
                                        kwhTableRightLimit.current = 20;
                                        kwhTableLeftLimit.current = 0;
                                    }

                                    kwhTableLeftLimit.current += pageIndex * 20;

                                    if (pageIndex == (pages.length - 1)) {
                                        kwhTableRightLimit.current = totalPowerConsumeTableRows.get.length;
                                    }
                                    else {
                                        kwhTableRightLimit.current += pageIndex * 20;
                                    }

                                    return <div
                                        style={{
                                            background: "white",
                                            width: "21cm",
                                            height: "29.7cm",
                                            display: "block",
                                            margin: "0 auto",
                                            marginBottom: "0.4cm",
                                            boxShadow: "0 0 0.4cm rgba(0,0,0,0.5)",
                                        }}
                                    >

                                        <TableContainer component={'div'}>
                                            <Table style={{ marginTop: 0 }} className={classes.table} aria-label="customized table">
                                                <TableHead>
                                                    <TableRow>
                                                        <StyledTableCell>Máquina</StyledTableCell>
                                                        <StyledTableCell align="right">Consumo Ativo Total</StyledTableCell>
                                                        <StyledTableCell align="right">Consumo Reativo Total</StyledTableCell>
                                                        <StyledTableCell align="right">Consumo Aparente Total</StyledTableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {totalPowerConsumeTableRows.get.slice(kwhTableLeftLimit.current, kwhTableRightLimit.current).map((row) => {

                                                        return (
                                                            <StyledTableRow key={row.assetName}>
                                                                <StyledTableCell component="th" scope="row">
                                                                    {row.assetName}
                                                                </StyledTableCell>
                                                                <StyledTableCell align="right">{`${row.totalActivePower.ammount.toFixed(2)} kW/h`} <br /> {`R$ ${row.totalActivePower.cost.toFixed(2)}`}</StyledTableCell>
                                                                <StyledTableCell align="right">{`${row.totalReactivePower.toFixed(2)} kVAr/h`}</StyledTableCell>
                                                                <StyledTableCell align="right">{`${row.totalSeemingPower.toFixed(2)} kVA/h`}</StyledTableCell>
                                                            </StyledTableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </div>
                                })
                        }
                        <div
                            style={{
                                background: "white",
                                width: "21cm",
                                height: "29.7cm",
                                display: "block",
                                margin: "0 auto",
                                marginBottom: "0.4cm",
                                boxShadow: "0 0 0.4cm rgba(0,0,0,0.5)",
                                padding: 24
                            }}

                            id="totalEnergyConsumeGraphs"
                        >
                            <b style={{ fontSize: 20 }}>3. Detalhes de consumo</b>

                            <p style={{ fontSize: 14, marginTop: 24 }}>
                                Durante o periodo que vai de <b>{getDatePeriodFromDateSelection()?.start ? getDatePeriodFromDateSelection()?.start : "(data não informada)"}</b> até <b>{getDatePeriodFromDateSelection()?.end ? getDatePeriodFromDateSelection()?.end : "(data não informada)"}</b>
                                {" "}o consumo de energia elétrica total de todas as máquinas selecionadas foi <b>| Potência Ativa: {totalActivePower.current.toFixed(2)} kW/h | </b>
                                <b>Potência Reativa: {totalReactivePower.current.toFixed(2)} kVAr/h | </b>
                                <b>Potência Aparente: {totalSeemingPower.current.toFixed(2)} kVA/h | </b>
                                Sendo que o valor em R$ cobrado por essa quantidade de consumo foi de: <b>R$ {totalActivePowerCost.current.toFixed(2)}</b>
                            </p>
                            <div style={{ marginTop: 48 }}>
                                <Plot
                                    id="activePowerConsumeKwh"
                                    data={[
                                        {
                                            type: 'bar', x: Object.keys(energyGraphData.get ? energyGraphData.get.total : {}), y: energyGraphData.get ? Object.values(energyGraphData.get.total).map((e: any) => {
                                                return e.active.ammount.toFixed(2)
                                            }) : []
                                        },
                                    ]}
                                    layout={{ width: 700, height: 400, title: `Consumo total de energia elétrica (kW/h)` }}
                                />

                                <Plot
                                    data={[
                                        {
                                            type: 'bar', x: Object.keys(energyGraphData.get ? energyGraphData.get.total : {}), y: energyGraphData.get ? Object.values(energyGraphData.get.total).map((e: any) => {
                                                return e.active.cost.toFixed(2)
                                            }) : []
                                        },
                                    ]}
                                    layout={{ width: 700, height: 400, title: 'Custo da energia elétrica (R$)' }}
                                />
                            </div>
                        </div>
                        {
                            Array(Math.ceil(Object.keys(energyGraphData.get ? energyGraphData.get : {}).filter(e => e != "total").length / 2)).fill(0)
                                .map((e, pageIndex, pages) => {

                                    if (pageIndex == 0) {
                                        individualDevicesGraphsRightLimit.current = 1;
                                        individualDevicesGraphsLeftLimit.current = 0;
                                    }

                                    individualDevicesGraphsLeftLimit.current += pageIndex * 1;

                                    if (pageIndex == (pages.length - 1)) {
                                        individualDevicesGraphsRightLimit.current = energyGraphData.get.length;
                                    }
                                    else {
                                        individualDevicesGraphsRightLimit.current += pageIndex * 1;
                                    }

                                    return <div
                                        style={{
                                            background: "white",
                                            width: "21cm",
                                            height: "29.7cm",
                                            display: "block",
                                            margin: "0 auto",
                                            marginBottom: "0.4cm",
                                            boxShadow: "0 0 0.4cm rgba(0,0,0,0.5)",
                                            padding: 24
                                        }}

                                        id={`${individualDevicesGraphsLeftLimit.current}-${individualDevicesGraphsRightLimit.current}-EnergyConsumeGraphs`}
                                    >
                                        {Object.keys(energyGraphData.get ? energyGraphData.get : {}).filter(e => e != "total")
                                            .slice(individualDevicesGraphsLeftLimit.current, individualDevicesGraphsRightLimit.current)
                                            .map((e: any) => {
                                                {
                                                    console.log(e)
                                                    return <>
                                                        <b style={{ fontSize: 20 }}>3. Detalhes de consumo da máquina {e.toUpperCase()}</b>

                                                        <Plot
                                                            id="activePowerConsumeKwh"
                                                            data={[
                                                                {
                                                                    type: 'bar', x: Object.keys(energyGraphData.get ? energyGraphData.get[e] : {}), y: energyGraphData.get ? Object.values(energyGraphData.get[e]).map((e: any) => {
                                                                        return e.active.ammount.toFixed(2)
                                                                    }) : []
                                                                },
                                                            ]}
                                                            layout={{ width: 700, height: 400, title: `Consumo total de energia elétrica (kW/h)` }}
                                                        />

                                                        <Plot
                                                            data={[
                                                                {
                                                                    type: 'bar', x: Object.keys(energyGraphData.get ? energyGraphData.get[e] : {}), y: energyGraphData.get ? Object.values(energyGraphData.get[e]).map((e: any) => {
                                                                        return e.active.cost.toFixed(2)
                                                                    }) : []
                                                                },
                                                            ]}
                                                            layout={{ width: 700, height: 400, title: 'Custo da energia elétrica (R$)' }}
                                                        />
                                                    </>
                                                }
                                            })}
                                    </div>
                                })
                        }

                    </Paper>
                </Grid>
            </Grid>
        </div >);
}

export { GeneralReportView }