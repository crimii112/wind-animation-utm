import moment from 'moment';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SimpleTimeSeriesGraph = ({ data }) => {
  if (!data || data.length === 0 || data[0] === 'NO DATA') return;

  const firstItem = data[0] || {};

  /* 툴팁 커스텀 */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const { name, value } = payload[0];

    return (
      <div
        style={{
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '5px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            color: '#003f5c',
            marginBottom: '8px',
          }}
        >
          {label}
        </div>
        <div style={{ color: '#333' }}>
          {name} :{' '}
          <strong>
            {value}({payload[0].payload.itemUnit})
          </strong>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <div className="text-center text-lg font-bold mt-5">
        초미세먼지({firstItem.dongNm})
      </div>
      <LineChart
        data={data}
        margin={{ top: 30, right: 70, bottom: 20, left: 30 }}
      >
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{
            paddingTop: 20,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
          }}
        />
        <Tooltip content={CustomTooltip} />
        <CartesianGrid strokeDasharray="3" vertical={false} />
        <XAxis dataKey="time" allowDuplicatedCategory={false} fontSize={14} />
        <YAxis
          orientation="left"
          type="number"
          fontSize={14}
          allowDataOverflow={true}
          domain={['auto', 'auto']}
          label={{
            value: `(${firstItem.itemUnit})`,
            angle: -90,
            position: 'insideLeft',
            fontWeight: 'bold',
            dy: 50,
          }}
        />
        <Line
          data={data}
          dataKey="conc"
          name={'초미세먼지'}
          stroke={'#003f5c'}
          strokeWidth={1.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SimpleTimeSeriesGraph;
