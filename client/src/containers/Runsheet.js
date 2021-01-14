import { useEffect, useState } from "react"

function Item(props)
{
    return;
}

function Runsheet(props)
{
    if(props.runsheet.id === "")
        return(<p>Missing Runsheet Id</p>);
    return(<div>
        
    </div>);
}

export default function Runsheet()
{
    const [runsheet,setRunsheet] = useState({
        id : "",
        service_info:  {
            campus: "",
            service: "",
            title: "",
            subtitle: "",
            date : {
                to: {},
                from: {}
            }
        },
        team: [],
        items: [],
        notes: {}
    });

    useEffect(() => {
        fetch()
        .then(res => res.json())
        .then(res => {
            if(!res.error)
                setRunsheet(res);
        })
    });

    return(<div></div>)
}