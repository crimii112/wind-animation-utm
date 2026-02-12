import { useContext, useState } from 'react';
import styled from 'styled-components';

import { UtmContext } from '@/components/utm/UtmContext';

const UtmMapControlPanel = () => {
  const {
    settings,
    updateSettings,
    style,
    updateStyle,
    layerVisible,
    toggleLayer,
  } = useContext(UtmContext);

  const dateTime = settings.dateTime;
  const [open, setOpen] = useState(true);

  const formatLocalDate = date => {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}`;
  };

  if (!open)
    return <PanelOpenBtn onClick={() => setOpen(true)}>지도 설정</PanelOpenBtn>;

  return (
    <Panel>
      {dateTime && (
        <DatetimeHeader>
          <span className="date-text">
            {formatLocalDate(dateTime)}{' '}
            {String(dateTime.getHours()).padStart(2, '0')}시
          </span>
        </DatetimeHeader>
      )}

      <ControlGroup>
        <label className="main-label">
          <input
            type="checkbox"
            checked={layerVisible.concImage}
            onChange={e => toggleLayer('concImage', e.target.checked)}
          />
          <span>등농도 이미지</span>
        </label>

        {layerVisible.concImage && (
          <div className="sub-container">
            <SubRow>
              <span className="label-text">투명도</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={style.concImageOpacity}
                onChange={e =>
                  updateStyle('concImageOpacity', Number(e.target.value))
                }
              />
              <span className="value-text">
                {Math.round(style.concImageOpacity * 100)}%
              </span>
            </SubRow>
          </div>
        )}
      </ControlGroup>

      <ControlGroup>
        <label className="main-label">
          <input
            type="checkbox"
            checked={layerVisible.windImage}
            onChange={e => toggleLayer('windImage', e.target.checked)}
          />
          <span>바람장 이미지</span>
        </label>
        {layerVisible.windImage && (
          <div className="sub-container">
            <SubRow>
              <span className="label-text">투명도</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={style.windImageOpacity}
                onChange={e =>
                  updateStyle('windImageOpacity', Number(e.target.value))
                }
              />
              <span className="value-text">
                {Math.round(style.windImageOpacity * 100)}%
              </span>
            </SubRow>
          </div>
        )}
      </ControlGroup>

      <ControlGroup>
        <label className="main-label">
          <input
            type="checkbox"
            checked={layerVisible.windAnimation}
            onChange={e => toggleLayer('windAnimation', e.target.checked)}
          />
          <span>바람장 애니메이션</span>
        </label>
        {layerVisible.windAnimation && (
          <div className="sub-container">
            <SubRow>
              <span className="label-text">색상</span>
              <ColorPicker>
                <div style={{ backgroundColor: style.windColor }} />
                <input
                  type="color"
                  value={style.windColor}
                  onChange={e => updateStyle('windColor', e.target.value)}
                />
              </ColorPicker>
            </SubRow>
          </div>
        )}
      </ControlGroup>
      <FoldBtn onClick={() => setOpen(false)}>접어두기</FoldBtn>
    </Panel>
  );
};

export default UtmMapControlPanel;

const Panel = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;

  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);

  display: flex;
  flex-direction: column;
  gap: 10px;

  font-size: 14px;
  color: #333;

  max-height: calc(100vh - 24px);
  overflow-y: auto;
  // scrollbar-gutter: stable;
  overscroll-behavior: contain;
`;

const PanelOpenBtn = styled.button`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;

  padding: 8px 10px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    background: #f8f9fa;
    border-color: #bbb;
  }
`;

const DatetimeHeader = styled.div`
  padding-bottom: 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid #eee;
  text-align: center;

  .date-text {
    font-weight: 600;
    font-size: 16px;
    color: #333;
  }
`;

const ControlGroup = styled.div`
  padding: 8px 0;
  border-top: 1px solid #f5f5f5;

  .main-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }

  .sub-container {
    padding-left: 24px;
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
`;

const SubRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #555;

  .label-text {
    min-width: 50px;
    color: #444;
    font-weight: 500;
  }

  select {
    min-width: 110px;
    padding: 4px 22px 4px 8px;
    font-size: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff
      url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23666' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")
      no-repeat right 6px center;
    appearance: none;
  }

  input[type='range'] {
    flex: 1;
    height: 4px;
    accent-color: #4a90e2;
    cursor: pointer;
  }

  .value-text {
    min-width: 30px;
    text-align: right;
    color: #999;
  }
`;

const ColorPicker = styled.label`
  position: relative;
  width: 30px;
  height: 18px;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  border: 1px solid #ccc;

  div {
    width: 100%;
    height: 100%;
    display: block;
  }

  input[type='color'] {
    position: absolute;
    width: 150%;
    height: 150%;
    top: -25%;
    left: -25%;
    cursor: pointer;
    opacity: 0;
  }
`;

const FoldBtn = styled.button`
  margin-top: 5px;
  align-self: flex-end;
  background: none;
  border: none;
  font-size: 11px;
  color: #999;
  cursor: pointer;
  &:hover {
    color: #333;
    text-decoration: underline;
  }
`;
