import styled from 'styled-components';

const LccMapControlPanel = ({
  bgPoll,
  setBgPoll,
  arrowGap,
  setArrowGap,
  layerVisible,
  setLayerVisible,
}) => {
  return (
    <Panel>
      <label>
        <span>배경 물질</span>
        <select value={bgPoll} onChange={e => setBgPoll(e.target.value)}>
          <option value="O3">O3</option>
          <option value="PM10">PM10</option>
          <option value="PM2.5">PM2.5</option>
        </select>
      </label>
      <label>
        <span>바람 간격</span>
        <select
          value={arrowGap}
          onChange={e => {
            setArrowGap(Number(e.target.value));
          }}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={layerVisible.coords}
          onChange={e =>
            setLayerVisible(v => ({ ...v, coords: e.target.checked }))
          }
        />
        <span>물질 히트맵</span>
      </label>

      <label>
        <input
          type="checkbox"
          checked={layerVisible.arrows}
          onChange={e =>
            setLayerVisible(v => ({ ...v, arrows: e.target.checked }))
          }
        />
        <span>바람 화살표</span>
      </label>

      <label>
        <input
          type="checkbox"
          checked={layerVisible.windAnimation}
          onChange={e =>
            setLayerVisible(v => ({
              ...v,
              windAnimation: e.target.checked,
            }))
          }
        />
        <span>바람 애니메이션</span>
      </label>
    </Panel>
  );
};

export default LccMapControlPanel;

const Panel = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;

  background: rgba(255, 255, 255, 0.85);
  padding: 10px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);

  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
  }

  span {
    white-space: nowrap;
  }

  select {
    appearance: none; /* 기본 화살표 제거 */
    -webkit-appearance: none;
    -moz-appearance: none;

    width: 90px;
    padding: 6px 28px 6px 10px;
    font-size: 13px;
    border-radius: 6px;
    border: 1px solid #ccc;
    background-color: #fff;

    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;

    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  select:hover {
    border-color: #888;
  }

  select:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }
`;
